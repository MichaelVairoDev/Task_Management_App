import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Comment } from "./Comment";
import { Activity } from "./Activity";
import { TaskStatus } from "./TaskStatus";

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @ManyToOne(() => TaskStatus, (status) => status.tasks, { nullable: false })
  status: TaskStatus;

  @Column({ type: "timestamp" })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.assignedTasks, { nullable: true })
  assignee: User | null;

  @ManyToOne(() => User, (user) => user.createdTasks, { nullable: false })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments: Comment[];

  @OneToMany(() => Activity, (activity) => activity.task)
  activities: Activity[];
}
