import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Task } from "./Task";

export enum ActivityType {
  TASK_CREATED = "Tarea Creada",
  TASK_UPDATED = "Tarea Actualizada",
  TASK_DELETED = "Tarea Eliminada",
  COMMENT_ADDED = "Comentario Agregado",
  STATUS_CHANGED = "Estado Cambiado",
  ASSIGNEE_CHANGED = "Asignación Cambiada",
}

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  description: string;

  @Column({
    type: "enum",
    enum: ActivityType,
  })
  type: ActivityType;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ default: false })
  read: boolean;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Task)
  task: Task;
}
