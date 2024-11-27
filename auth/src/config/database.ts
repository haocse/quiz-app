import { DataSource } from "typeorm";
import { User } from "../entity/User";
import path from "path";
import { Quiz } from "../entity/Quiz";
import { Participation } from "../entity/Participation";

import bcrypt from 'bcryptjs';

const createInitialAdmin = async () => {
    const userRepository = AppDataSource.getRepository(User);
    
    // Check if any admin user exists
    const adminExists = await userRepository.findOne({
        where: { isAdmin: true }
    });

    if (!adminExists) {
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
};

export const initializeDatabase = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Database connection established");
        
        // Create initial admin after database is initialized
        await createInitialAdmin();
    } catch (error) {
        console.error("Error during database initialization:", error);
        throw error;
    }
};

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "../../database.sqlite"),
    synchronize: true,
    logging: true,
    entities: [User, Quiz, Participation],
    subscribers: [],
    migrations: [],
});