import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsEmail, Length, Matches } from "class-validator";
import { Quiz } from "./Quiz";
import { Participation } from "./Participation";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    @Length(5, 20)
    @Matches(/^[a-zA-Z0-9]+$/)
    username!: string;

    @Column()
    password!: string;

    @Column({ unique: true })
    @IsEmail()
    email!: string;

    @Column({ default: false })
    isAdmin!: boolean;

    @OneToMany(() => Participation, participation => participation.user)
    participations!: Participation[];
}