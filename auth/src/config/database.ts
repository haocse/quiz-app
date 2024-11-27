import { DataSource } from "typeorm";
import { User } from "../entity/User";
import path from "path";
import { Quiz } from "../entity/Quiz";
import { Participation } from "../entity/Participation";

import bcrypt from 'bcryptjs';

const createInitialUsers = async () => {
    const userRepository = AppDataSource.getRepository(User);
    const quizRepository = AppDataSource.getRepository(Quiz);
    
    // Check if any admin user exists
    const adminExists = await userRepository.findOne({
        where: { isAdmin: true }
    });

    if (!adminExists) {
        // Check for existing users first
        const existingAdmin = await userRepository.findOne({ where: { username: "admin" } });
        const existingUser1 = await userRepository.findOne({ where: { username: "user1" } });
        const existingUser2 = await userRepository.findOne({ where: { username: "user2" } });
        const existingQuiz1 = await quizRepository.findOne({ where: { code: "JS101" } });
        const existingQuiz2 = await quizRepository.findOne({ where: { code: "TS201" } });

        if (!existingAdmin) {
            const adminUser = new User();
            adminUser.username = "admin";
            adminUser.email = "admin@example.com";
            adminUser.password = await bcrypt.hash("Admin@123", 10);
            adminUser.isAdmin = true;

            await userRepository.save(adminUser);
            console.log("Initial admin account created:");
            console.log("Username: admin");
            console.log("Password: Admin@123");
            console.log("Email: admin@example.com");
        }

        if (!existingUser1) {
            const user1 = new User();
            user1.username = "user1";
            user1.email = "user1@example.com";
            user1.password = await bcrypt.hash("User1@123", 10);
            await userRepository.save(user1);
        }

        if (!existingUser2) {
            const user2 = new User();
            user2.username = "user2";
            user2.email = "user2@example.com";
            user2.password = await bcrypt.hash("User2@123", 10);
            await userRepository.save(user2);
        }

        if (!existingQuiz1) {
            const quiz1 = new Quiz();
            quiz1.title = "JavaScript Basics";
            quiz1.description = "Test your JavaScript fundamentals";
            quiz1.code = "JS101";
            quiz1.questions = [
                {
                    question: "What is JavaScript?",
                    options: ["A programming language", "A markup language", "A database", "A framework"],
                    correctAnswer: 0
                }
            ];
            quiz1.isActive = true;
            await quizRepository.save(quiz1);
        }

        if (!existingQuiz2) {
            const quiz2 = new Quiz();
            quiz2.title = "TypeScript Advanced";
            quiz2.description = "Advanced TypeScript concepts";
            quiz2.code = "TS201";
            quiz2.questions = [
                {
                    question: "What is a TypeScript interface?",
                    options: ["A class", "A contract for object structure", "A function", "A variable"],
                    correctAnswer: 1
                }
            ];
            quiz2.isActive = true;
            await quizRepository.save(quiz2);
        }
    }
};

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Database connection established");
        
        // Create initial users and quizzes after database is initialized
        await createInitialUsers();
    } catch (error) {
        console.error("Error during database initialization:", error);
        throw error;
    }
};

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "../../../database.sqlite"),
    synchronize: true,
    logging: true,
    entities: [User, Quiz, Participation],
    subscribers: [],
    migrations: [],
});