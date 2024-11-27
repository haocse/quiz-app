import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { AppDataSource } from '../src/config/database';
import authRoutes from '../src/routes/auth';
import { User } from '../src/entity/User';

const app = express();

// Setup middleware
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false
}));
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test123!@#',
          email: 'test@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'User created successfully');

      // Verify user was created in database
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { username: 'testuser' } });
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    it('should reject invalid registration data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test', // too short
          password: 'weak',
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test123!@#',
          email: 'test@example.com'
        });
    });

    it('should login successfully with username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });

    it('should login successfully with email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(async () => {
      agent = request.agent(app);
      
      // Create and login a user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test123!@#',
          email: 'test@example.com'
        });

      await agent
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!@#'
        });
    });

    it('should return user data for authenticated user', async () => {
      const response = await agent.get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Not authenticated');
    });
  });

  describe('POST /api/auth/logout', () => {
    let agent: ReturnType<typeof request.agent>;

    beforeEach(async () => {
      agent = request.agent(app);
      
      // Create and login a user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test123!@#',
          email: 'test@example.com'
        });

      await agent
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!@#'
        });
    });

    it('should logout successfully', async () => {
      const response = await agent.post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');

      // Verify we can't access protected routes anymore
      const meResponse = await agent.get('/api/auth/me');
      expect(meResponse.status).toBe(401);
    });
  });
});