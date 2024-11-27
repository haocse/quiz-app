import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { Quiz } from "./Quiz";

@Entity()
export class Participation {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.participations)
    user!: User;

    @ManyToOne(() => Quiz, quiz => quiz.participations)
    quiz!: Quiz;

    @Column({ default: 0 })
    score!: number;

    @Column('simple-json')
    answers!: {
        questionIndex: number;
        answer: number;
        isCorrect: boolean;
    }[];

    @CreateDateColumn()
    joinedAt!: Date;
}