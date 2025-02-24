import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { Activity } from "../entities/Activity";
import { AuthRequest } from "../middleware/auth";
import { TaskStatus } from "../entities/TaskStatus";
import { Between } from "typeorm";

const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);
const activityRepository = AppDataSource.getRepository(Activity);
const taskStatusRepository = AppDataSource.getRepository(TaskStatus);

export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener total de tareas por estado
    const tasksByStatus = await taskStatusRepository
      .createQueryBuilder("status")
      .leftJoinAndSelect("status.tasks", "task")
      .select(["status.name", "status.color", "COUNT(task.id) as count"])
      .groupBy("status.id")
      .getRawMany();

    // Obtener total de usuarios
    const totalUsers = await userRepository.count();

    // Obtener total de actividades
    const totalActivities = await activityRepository.count();

    // Obtener usuarios más activos
    const activeUsers = await userRepository
      .createQueryBuilder("user")
      .leftJoin("user.assignedTasks", "task")
      .select(["user.name", "user.email", "COUNT(task.id) as taskCount"])
      .groupBy("user.id")
      .orderBy("taskCount", "DESC")
      .limit(5)
      .getRawMany();

    const stats = {
      tasksByStatus,
      totalUsers,
      totalActivities,
      activeUsers,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error obteniendo estadísticas del sistema:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Obtener tareas asignadas por estado
    const tasksByStatus = await taskStatusRepository
      .createQueryBuilder("status")
      .leftJoinAndSelect("status.tasks", "task")
      .where("task.assigneeId = :userId", { userId })
      .select(["status.name", "status.color", "COUNT(task.id) as count"])
      .groupBy("status.id")
      .getRawMany();

    // Obtener total de actividades del usuario
    const totalActivities = await activityRepository.count({
      where: { user: { id: userId } },
    });

    // Obtener actividades recientes del usuario
    const recentActivities = await activityRepository.find({
      where: { user: { id: userId } },
      relations: ["task"],
      order: {
        timestamp: "DESC",
      },
      take: 5,
    });

    // Obtener tareas próximas a vencer
    const upcomingTasks = await taskRepository.find({
      where: {
        assignee: { id: userId },
        dueDate: Between(
          new Date(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      },
      relations: ["status"],
      order: {
        dueDate: "ASC",
      },
      take: 5,
    });

    const stats = {
      tasksByStatus,
      totalActivities,
      recentActivities,
      upcomingTasks,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error obteniendo estadísticas del usuario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
