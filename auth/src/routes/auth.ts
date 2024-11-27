import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../entity/User';
import { validate } from 'class-validator';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Zod schemas
const registerValidator = z.object({
    username: z.string()
      .min(5, 'Username must be at least 5 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9]+$/, 'Username can only contain letters and numbers')
      .refine(async (username) => {
        const existingUser = await userRepository.findOne({ where: { username } });
        return !existingUser;
      }, 'Username already exists'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(20, 'Password must be at most 20 characters')
      .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
      .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
      .regex(/^(?=.*\d)/, 'Password must contain at least one number')
      .regex(/^(?=.*[^A-Za-z0-9])/, 'Password must contain at least one special character'),
    email: z.string()
      .min(1, 'Email is required')
      .email('Invalid email format')
      .refine(async (email) => {
        const existingUser = await userRepository.findOne({ where: { email } });
        return !existingUser;
      }, 'Email already exists')
  });

const loginValidator = z.object({
  username: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
}).refine((data) => data.username || data.email, {
  message: "Either username or email must be provided"
});

router.post('/register', async (req, res) => {
    try {
        // Validate request body against schema
        await registerValidator.parseAsync(req.body);
        
        const { username, password, email } = req.body;

        const user = new User();
        user.username = username;
        user.password = await bcrypt.hash(password, 10);
        user.email = email;

        const errors = await validate(user);
        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        await userRepository.save(user);
        return res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        return res.status(500).json({ error: 'Error creating user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        // Validate request body
        const validatedData = await loginValidator.parseAsync(req.body);
        const { username, email, password, rememberMe } = validatedData;

        const user = await userRepository.findOne({
            where: [{ username }, { email }]
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        
        req.session.userId = user.id;
        if (rememberMe) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        }
        
        return res.json({ 
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ 
                error: 'Validation error', 
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        return res.status(500).json({ error: 'Error logging in' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        return res.json({ message: 'Logged out successfully' });
    });
});

router.get('/me', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await userRepository.findOne({ 
            where: { id: req.session.userId },
            select: ['id', 'username', 'email', 'isAdmin'] // Only send non-sensitive data
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        return res.json(user);
    } catch (error) {
        return res.status(500).json({ error: 'Error fetching user data' });
    }
});

export default router;