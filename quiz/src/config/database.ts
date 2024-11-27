import { DataSource } from "typeorm";
import { User } from "../entity/User";
import path from "path";
import { Quiz } from "../entity/Quiz";
import { Participation } from "../entity/Participation";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "../../database.sqlite"),
    synchronize: true,
    logging: true,
    entities: [User, Quiz, Participation],
    subscribers: [],
    migrations: [],
});