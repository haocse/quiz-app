import { Router } from 'express';
import { z } from 'zod';
import { AppDataSource } from '../config/database';
import { Quiz } from '../entity/Quiz';

const router = Router();

const createQuizSchema = z.object({
    title: z.string().min(1),
    description: z.string(),
    questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.number()
    }))
});

const updateQuizSchema = createQuizSchema.extend({
    id: z.number()
});

// Create a new quiz
router.post('/', async (req, res) => {
    try {
        const { title, description, questions } = await createQuizSchema.parseAsync(req.body);
        
        const quiz = new Quiz();
        quiz.title = title;
        quiz.description = description;
        quiz.questions = questions;
        quiz.code = Math.random().toString(36).substring(2, 8).toUpperCase(); // Generate random code
        quiz.isActive = true;

        await AppDataSource.getRepository(Quiz).save(quiz);
        
        res.status(201).json({ 
            message: 'Quiz created successfully',
            quizCode: quiz.code
        });
    } catch (error) {
        console.log(error)
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to create quiz'});
    }
});

// Get quiz by code
router.get('/:code', async (req, res) => {
    try {
        const quiz = await AppDataSource.getRepository(Quiz).findOne({
            where: { code: req.params.code, isActive: true },
            select: ['id', 'title', 'description', 'questions'] // Don't send correctAnswer to client
        });

        console.log(quiz)
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Remove correct answers from questions
        const sanitizedQuestions = quiz.questions.map(q => ({
            question: q.question,
            options: q.options
        }));

        res.json({ ...quiz, questions: sanitizedQuestions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});


router.get('/', async (req, res) => {
    try {
        const quizRepository = AppDataSource.getRepository(Quiz);
        const quizzes = await quizRepository.find({
            select: [
                'id',
                'title',
                'description',
                'code',
                'isActive',
                'createdAt'
            ],
            relations: ['participations'],
            order: {
                createdAt: 'DESC'
            }
        });

        // Transform the data to include participant count
        const quizData = quizzes.map(quiz => ({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            code: quiz.code,
            isActive: quiz.isActive,
            createdAt: quiz.createdAt,
            participantCount: quiz.participations.length
        }));

        res.json(quizData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// Toggle quiz active status (only creator can do this)
router.patch('/:id/toggle-status', async (req, res) => {
    try {
        const quizRepository = AppDataSource.getRepository(Quiz);
        const quiz = await quizRepository.findOne({
            where: { id: parseInt(req.params.id) }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        quiz.isActive = !quiz.isActive;
        await quizRepository.save(quiz);

        res.json({ message: 'Quiz status updated', isActive: quiz.isActive });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Failed to update quiz status' });
    }
});

router.get('/:id/edit', async (req, res) => {
    try {
        const quiz = await AppDataSource.getRepository(Quiz).findOne({
            where: { id: parseInt(req.params.id) }
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.json(quiz);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { title, description, questions } = await updateQuizSchema.parseAsync(req.body);
        
        const quizRepository = AppDataSource.getRepository(Quiz);
        const quiz = await quizRepository.findOne({
            where: { id: parseInt(req.params.id) },
            relations: ['creator']
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        quiz.title = title;
        quiz.description = description;
        quiz.questions = questions;

        await quizRepository.save(quiz);
        
        res.json({ message: 'Quiz updated successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        res.status(500).json({ error: 'Failed to update quiz' });
    }
});

export default router;