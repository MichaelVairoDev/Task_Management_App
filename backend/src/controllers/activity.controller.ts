import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Activity } from "../entities/Activity";
import { AuthRequest } from "../middleware/auth";

const activityRepository = AppDataSource.getRepository(Activity);

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await activityRepository.find({
      relations: ["user", "task"],
      order: {
        timestamp: "DESC",
      },
      take: 10,
    });

    res.json(activities);
  } catch (error) {
    console.error("Error obteniendo actividades recientes:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await activityRepository.find({
      where: {
        user: { id: req.user!.id },
      },
      relations: ["task"],
      order: {
        timestamp: "DESC",
      },
      take: 20,
    });

    res.json(activities);
  } catch (error) {
    console.error("Error obteniendo actividades del usuario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getTaskActivity = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    const activities = await activityRepository.find({
      where: {
        task: { id: parseInt(taskId) },
      },
      relations: ["user"],
      order: {
        timestamp: "DESC",
      },
    });

    res.json(activities);
  } catch (error) {
    console.error("Error obteniendo actividades de la tarea:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
