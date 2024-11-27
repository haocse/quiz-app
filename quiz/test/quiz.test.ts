import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { AppDataSource } from '../src/config/database';
import quizRoutes from '../src/routes/quiz';
import { Quiz } from '../src/entity/Quiz';
import { User } from '../src/entity/User';
import bcrypt from 'bcryptjs';

const app = express();

// Setup middleware
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));
app.use('/api/quiz', quizRoutes);

describe('Quiz Routes', () => {
  let testUser: User;

  beforeEach(async () => {
    // Create a test user
    const userRepository = AppDataSource.getRepository(User);
    testUser = new User();
    testUser.username = 'testuser';
    testUser.email = 'test@example.com';
    testUser.password = await bcrypt.hash('Test123!@#', 10);
    await userRepository.save(testUser);
  });

  describe('POST /api/quiz', () => {
    const validQuiz = {
      title: 'Test Quiz',
      description: 'A test quiz',
      questions: [
        {
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1
        }
      ]
    };

    it('should create a new quiz successfully', async () => {
      // Mock authenticated session
      const agent = request.agent(app);
      agent.set('Cookie', [`connect.sid=test-session; userId=${testUser.id}`]);

      const response = await agent
        .post('/api/quiz')
        .send(validQuiz);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Quiz created successfully');
      expect(response.body).toHaveProperty('quizCode');
      expect(response.body.quizCode).toMatch(/^[A-Z0-9]{6}$/);

      // Verify quiz was created in database
      const quizRepository = AppDataSource.getRepository(Quiz);
      const quiz = await quizRepository.findOne({ 
        where: { title: 'Test Quiz' }
      });
      expect(quiz).toBeTruthy();
    });

    it('should reject invalid quiz data', async () => {
      const agent = request.agent(app);
      agent.set('Cookie', [`connect.sid=test-session; userId=${testUser.id}`]);

      const response = await agent
        .post('/api/quiz')
        .send({
          title: '', // Invalid: empty title
          description: 'Test',
          questions: [] // Invalid: no questions
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('GET /api/quiz/:code', () => {
    let testQuiz: Quiz;

    beforeEach(async () => {
      // Create a test quiz
      const quizRepository = AppDataSource.getRepository(Quiz);
      testQuiz = new Quiz();
      testQuiz.title = 'Test Quiz';
      testQuiz.description = 'Description';
      testQuiz.code = 'TEST12';
      testQuiz.isActive = true;
      testQuiz.questions = [{
        question: 'Test question?',
        options: ['A', 'B', 'C'],
        correctAnswer: 0
      }];
      await quizRepository.save(testQuiz);
    });

    it('should return quiz without correct answers', async () => {
      const response = await request(app)
        .get(`/api/quiz/${testQuiz.code}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Test Quiz');
      expect(response.body.questions[0]).not.toHaveProperty('correctAnswer');
      expect(response.body.questions[0]).toHaveProperty('options');
      expect(response.body.questions[0]).toHaveProperty('question');
    });

    it('should return 404 for non-existent quiz', async () => {
      const response = await request(app)
        .get('/api/quiz/NONEXIST');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Quiz not found');
    });
  });

});