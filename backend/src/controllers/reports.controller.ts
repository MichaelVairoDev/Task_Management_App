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

export const generateTaskReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Las fechas de inicio y fin son requeridas",
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const tasks = await taskRepository.find({
      where: {
        createdAt: Between(start, end),
      },
      relations: ["assignee", "status"],
      order: {
        createdAt: "DESC",
      },
    });

    const tasksByStatus = await taskStatusRepository
      .createQueryBuilder("status")
      .leftJoinAndSelect("status.tasks", "task")
      .where("task.createdAt BETWEEN :start AND :end", { start, end })
      .select(["status.name", "status.color", "COUNT(task.id) as count"])
      .groupBy("status.id")
      .getRawMany();

    const report = {
      period: {
        start,
        end,
      },
      totalTasks: tasks.length,
      tasksByStatus,
      tasks,
    };

    res.json(report);
  } catch (error) {
    console.error("Error generando reporte de tareas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const generateUserActivityReport = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Las fechas de inicio y fin son requeridas",
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const activities = await activityRepository.find({
      where: {
        timestamp: Between(start, end),
      },
      relations: ["user", "task"],
      order: {
        timestamp: "DESC",
      },
    });

    const userActivities = await userRepository
      .createQueryBuilder("user")
      .leftJoin("user.assignedTasks", "task")
      .where("task.createdAt BETWEEN :start AND :end", { start, end })
      .select(["user.name", "user.email", "COUNT(task.id) as taskCount"])
      .groupBy("user.id")
      .getRawMany();

    const report = {
      period: {
        start,
        end,
      },
      totalActivities: activities.length,
      userActivities,
      activities,
    };

    res.json(report);
  } catch (error) {
    console.error("Error generando reporte de actividad de usuarios:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const generateSystemReport = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(0);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Obtener estadísticas del sistema para el período
    const [totalTasks, totalUsers, totalActivities] = await Promise.all([
      taskRepository.count({
        where: {
          createdAt: Between(start, end),
        },
      }),
      userRepository.count({
        where: {
          createdAt: Between(start, end),
        },
      }),
      activityRepository.count({
        where: {
          timestamp: Between(start, end),
        },
      }),
    ]);

    // Obtener distribución de tareas por estado
    const tasksByStatus = await taskStatusRepository
      .createQueryBuilder("status")
      .leftJoinAndSelect("status.tasks", "task")
      .where("task.createdAt BETWEEN :start AND :end", { start, end })
      .select(["status.name", "status.color", "COUNT(task.id) as count"])
      .groupBy("status.id")
      .getRawMany();

    // Calcular tareas completadas (asumiendo que el estado "Completada" tiene ese nombre)
    const completedTasks =
      tasksByStatus.find((status) => status.name === "Completada")?.count || 0;

    // Obtener distribución de actividades por tipo
    const activitiesByType = await activityRepository
      .createQueryBuilder("activity")
      .select("activity.type", "type")
      .addSelect("COUNT(*)", "count")
      .where("activity.timestamp BETWEEN :start AND :end", { start, end })
      .groupBy("activity.type")
      .getRawMany();

    const reportData = {
      period: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalTasks,
        completedTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalUsers,
        totalActivities,
        averageActivitiesPerUser:
          totalUsers > 0 ? totalActivities / totalUsers : 0,
      },
      taskDistribution: tasksByStatus,
      activityDistribution: activitiesByType,
    };

    res.json(reportData);
  } catch (error) {
    console.error("Error generando reporte del sistema:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
