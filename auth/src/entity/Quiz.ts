import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { User } from "./User";
import { Participation } from "./Participation";

@Entity()
export class Quiz {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    description!: string;

    @Column()
    code!: string; // Unique code for joining

    @Column('simple-json')
    questions!: {
        question: string;
        options: string[];
        correctAnswer: number;
    }[];

    @CreateDateColumn()
    createdAt!: Date;

    @ManyToOne(() => User, user => user.createdQuizzes)
    creator!: User;

    @OneToMany(() => Participation, participation => participation.quiz)
    participations!: Participation[];

    @Column({ default: false })
    isActive!: boolean;
}