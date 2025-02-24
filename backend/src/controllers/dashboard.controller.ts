import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { Activity } from "../entities/Activity";
import { AuthenticatedRequest } from "../types/express";
import { TaskStatus } from "../entities/TaskStatus";
import { Between, LessThanOrEqual, MoreThanOrEqual, Not } from "typeorm";

const taskRepository = AppDataSource.getRepository(Task);
const userRepository = AppDataSource.getRepository(User);
const activityRepository = AppDataSource.getRepository(Activity);
const taskStatusRepository = AppDataSource.getRepository(TaskStatus);

export const getDashboardData = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const { period = "today" } = req.query;

    let startDate = new Date();
    const endDate = new Date();

    // Configurar el período de tiempo
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default: // today
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Obtener estadísticas de tareas del usuario
    const taskStats = await taskStatusRepository
      .createQueryBuilder("status")
      .leftJoinAndSelect("status.tasks", "task")
      .where(
        "(task.assigneeId = :userId OR task.userId = :userId) AND task.createdAt BETWEEN :startDate AND :endDate",
        { userId, startDate, endDate }
      )
      .select([
        "status.id as id",
        "status.name as name",
        "status.color as color",
        "COUNT(task.id) as count",
        "status.order as order"
      ])
      .groupBy("status.id")
      .orderBy("status.order", "ASC")
      .getRawMany();

    // Obtener actividades recientes del usuario
    const recentActivities = await activityRepository.find({
      where: [
        { user: { id: userId }, timestamp: Between(startDate, endDate) },
        { task: { assignee: { id: userId } }, timestamp: Between(startDate, endDate) }
      ],
      relations: ["user", "task", "task.status"],
      order: {
        timestamp: "DESC",
      },
      take: 10,
    });

    // Obtener tareas próximas del usuario
    const upcomingTasks = await taskRepository.find({
      where: [
        { 
          assignee: { id: userId },
          dueDate: MoreThanOrEqual(new Date()),
          status: { name: Not("Completada") }
        },
        {
          user: { id: userId },
          dueDate: MoreThanOrEqual(new Date()),
          status: { name: Not("Completada") }
        }
      ],
      relations: ["assignee", "status", "comments"],
      order: {
        dueDate: "ASC",
      },
      take: 5,
    });

    // Obtener estadísticas adicionales
    const overdueTasksCount = await taskRepository.count({
      where: [
        {
          assignee: { id: userId },
          dueDate: LessThanOrEqual(new Date()),
          status: { name: Not("Completada") }
        },
        {
          user: { id: userId },
          dueDate: LessThanOrEqual(new Date()),
          status: { name: Not("Completada") }
        }
      ]
    });

    const totalTasksCount = await taskRepository.count({
      where: [
        { assignee: { id: userId } },
        { user: { id: userId } }
      ]
    });

    const completedTasksCount = await taskRepository.count({
      where: [
        { assignee: { id: userId }, status: { name: "Completada" } },
        { user: { id: userId }, status: { name: "Completada" } }
      ]
    });

    const dashboardData = {
      taskStats,
      recentActivities,
      upcomingTasks,
      additionalStats: {
        overdueTasks: overdueTasksCount,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
        completionRate: totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error obteniendo datos del dashboard:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
