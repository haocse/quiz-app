import 'reflect-metadata';
import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import { AppDataSource } from './config/database';
import quizRoutes from './routes/quiz';
import { QuizWebSocketServer } from './websocket'; // Add this import
import { createServer } from 'http'; // Add this import
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = createServer(app); // Create HTTP server instance

// Redis client setup
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

// Middleware
app.use(express.json());

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Routes
app.use('/api/quiz', quizRoutes); // Add this line


// Initialize WebSocket server
const wss = new QuizWebSocketServer(server); // Add this line

// Database initialization and server start
AppDataSource.initialize()
  .then(() => {
    server.listen(3001, () => { // Use 'server' instead of 'app'
      console.log('Server running on http://localhost:3001');
    });
  })
  .catch(error => console.log(error));