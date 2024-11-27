import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { Quiz } from './entity/Quiz';
import { Participation } from './entity/Participation';
import { AppDataSource } from './config/database';

interface Client extends WebSocket {
    userId?: number;
    quizId?: number;
}

export class QuizWebSocketServer {
    private wss: WebSocketServer;
    private quizRooms: Map<number, Set<Client>> = new Map();

    constructor(server: Server) {
        this.wss = new WebSocketServer({ server });
        this.setupWebSocket();
    }

    private setupWebSocket() {
        this.wss.on('connection', (ws: Client) => {
            ws.on('message', async (message: string) => {
                const data = JSON.parse(message);
                
                switch (data.type) {
                    case 'join':
                        await this.handleJoin(ws, data);
                        break;
                    case 'answer':
                        await this.handleAnswer(ws, data);
                        break;
                }
            });

            ws.on('close', () => {
                if (ws.quizId) {
                    const room = this.quizRooms.get(ws.quizId);
                    room?.delete(ws);
                }
            });
        });
    }

    private async handleJoin(ws: Client, data: any) {
        const { userId, quizCode } = data;
        console.log("handleJoin: ", data)
        
        const quizRepository = AppDataSource.getRepository(Quiz);
        console.log("quiz---zz")
        const quiz = await quizRepository.findOne({ 
            where: { code: quizCode, isActive: true },
            relations: ['participations', 'participations.user']
        });

        console.log("quiz---")
        console.log(quiz)

        if (!quiz) {
            ws.send(JSON.stringify({ type: 'error', message: 'Quiz not found' }));
            return;
        }

        // Get the user entity
        const userRepository = AppDataSource.getRepository('User');
        const user = await userRepository.findOneBy({ id: userId });

        if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
            return;
        }

        // Create or find participation
        const participationRepo = AppDataSource.getRepository(Participation);
        let participation = await participationRepo.findOne({
            where: {
                quiz: { code: quizCode },
                user: { id: userId }
            }
        });

        if (!participation) {
            participation = participationRepo.create();
            participation.quiz = quiz;
            participation.user = user;
            participation.score = 0;
            participation.answers = [];
            
            // Save with explicit relations
            await participationRepo.save(participation, {
                reload: true,
                data: {
                    user: user,
                    quiz: quiz
                }
            });
        }

        ws.userId = userId;
        ws.quizId = quiz.id;

        if (!this.quizRooms.has(quiz.id)) {
            this.quizRooms.set(quiz.id, new Set());
        }
        this.quizRooms.get(quiz.id)?.add(ws);

        // Send current leaderboard
        this.broadcastLeaderboard(quiz.id);
    }

    private async handleAnswer(ws: Client, data: any) {
        console.log('Handling answer:', data);
        const { questionIndex, answer } = data;
        
        if (!ws.quizId || !ws.userId) return;

        const participationRepo = AppDataSource.getRepository(Participation);
        const participation = await participationRepo.findOne({
            where: {
                quiz: { id: ws.quizId },
                user: { id: ws.userId }
            },
            relations: ['quiz']
        });

        if (!participation) return;

        // Update score and answers
        const isCorrect = participation.quiz.questions[questionIndex].correctAnswer === answer;
        participation.score += isCorrect ? 10 : 0;
        participation.answers.push({ questionIndex, answer, isCorrect });
        
        await participationRepo.save(participation);

        // Broadcast updated leaderboard
        this.broadcastLeaderboard(ws.quizId);
    }

    private async broadcastLeaderboard(quizId: number) {
        const participationRepo = AppDataSource.getRepository(Participation);
        const leaderboard = await participationRepo.find({
            where: { quiz: { id: quizId } },
            relations: ['user'],
            order: { score: 'DESC' }
        });

        const leaderboardData = leaderboard.map(p => ({
            username: p.user.username,
            score: p.score
        }));

        console.log(leaderboardData)

        const room = this.quizRooms.get(quizId);
        room?.forEach(client => {
            client.send(JSON.stringify({
                type: 'leaderboard',
                data: leaderboardData
            }));
        });
    }
}