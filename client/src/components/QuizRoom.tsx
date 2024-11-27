import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';

interface Question {
    question: string;
    options: string[];
}

interface Participant {
    username: string;
    score: number;
}

interface QuizState {
    currentQuestion: number;
    hasSubmitted: boolean;
    isFinished: boolean;
}

export const QuizRoom: React.FC<{ quizCode: string; onExit: () => void }> = ({ quizCode, onExit }) => {
    const { user } = useAuth();
    const [quiz, setQuiz] = useState<{ title: string; questions: Question[] } | null>(null);
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [quizState, setQuizState] = useState<QuizState>({
        currentQuestion: 0,
        hasSubmitted: false,
        isFinished: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                const quizData = await api.getQuiz(quizCode);
                console.log("quizData", quizData);
                setQuiz(quizData);

                // Check if user has already completed this quiz
                const participant = quizData.participations?.find(
                    (p: any) => p.user.username === user?.username
                );
                
                if (participant && participant.answers?.length === quizData.questions.length) {
                    const shouldRedo = window.confirm(
                        'You have already completed this quiz. Would you like to try again?'
                    );
                    
                    if (!shouldRedo) {
                        setQuizState(prev => ({
                            ...prev,
                            isFinished: true
                        }));
                        return;
                    }
                }
            } catch (error) {
                toast.error('Failed to load quiz');
            } finally {
                setIsLoading(false);
            }
        };

        loadQuiz();
    }, [quizCode, user]);

    useEffect(() => {
        if (!user || !quiz || quizState.isFinished) return;

        console.log(user)

        // Connect to WebSocket
        const ws = new WebSocket(`ws://localhost:3001`);
        wsRef.current = ws;

        ws.onopen = () => {
            // Join the quiz room
            ws.send(JSON.stringify({
                type: 'join',
                quizCode,
                userId: (user as any).id
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            
            switch (data.type) {
                case 'leaderboard':
                    console.log('Updating leaderboard:', data.data);
                    setLeaderboard(data.data);
                    break;
                case 'questionChange':
                    setQuizState(prev => ({
                        ...prev,
                        currentQuestion: data.questionIndex,
                        hasSubmitted: false
                    }));
                    break;
                case 'error':
                    toast.error(data.message);
                    break;
            }
        };

        ws.onerror = () => {
            toast.error('Connection error');
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [user, quiz, quizCode, quizState.isFinished]);

    useEffect(() => {
        if (quizState.hasSubmitted && !isLastQuestion) {
            // After submitting, wait 3 seconds then move to next question
            const timer = setTimeout(() => {
                setQuizState(prev => ({
                    ...prev,
                    currentQuestion: prev.currentQuestion + 1,
                    hasSubmitted: false
                }));
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [quizState.hasSubmitted]);

    const handleAnswer = (answerIndex: number) => {
        if (!wsRef.current || quizState.hasSubmitted || quizState.isFinished) return;

        wsRef.current.send(JSON.stringify({
            type: 'answer',
            questionIndex: quizState.currentQuestion,
            answer: answerIndex
        }));

        setQuizState(prev => ({
            ...prev,
            hasSubmitted: true
        }));

        toast.success('Answer submitted!');
    };

    if (isLoading) {
        return <div className="text-center py-8">Loading quiz...</div>;
    }

    if (!quiz) {
        return <div className="text-center py-8">Quiz not found</div>;
    }

    if (quizState.isFinished) {
        return (
            <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
                <p className="text-gray-600 mb-4">You have already completed this quiz.</p>
                <div className="space-x-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={onExit}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Exit Quiz
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[quizState.currentQuestion];
    const isLastQuestion = quizState.currentQuestion === quiz.questions.length - 1;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quiz Content */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
                        <button
                            onClick={onExit}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Exit
                        </button>
                    </div>
                    <div className="text-gray-600">
                        Question {quizState.currentQuestion + 1} of {quiz.questions.length}
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-xl mb-4">{currentQuestion.question}</h3>
                    <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={quizState.hasSubmitted}
                                className={`w-full p-4 text-left rounded-lg border transition-colors ${
                                    quizState.hasSubmitted
                                        ? 'cursor-not-allowed opacity-75'
                                        : 'hover:bg-blue-50 hover:border-blue-500'
                                } ${
                                    quizState.hasSubmitted && 'bg-gray-50'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {quizState.hasSubmitted && (
                    <div className="text-center text-gray-600">
                        {isLastQuestion ? 'Quiz complete!' : 'Moving to next question...'}
                    </div>
                )}
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4">Leaderboard</h3>
                <div className="space-y-3">
                    {leaderboard.map((participant, index) => (
                        <div
                            key={participant.username}
                            className={`flex justify-between items-center p-2 rounded ${
                                participant.username === user?.username
                                    ? 'bg-blue-50 font-medium'
                                    : ''
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">#{index + 1}</span>
                                <span>{participant.username}</span>
                            </div>
                            <span className="font-semibold">{participant.score}</span>
                        </div>
                    ))}

                    {leaderboard.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                            No participants yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};