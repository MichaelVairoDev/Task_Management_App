import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Activity } from "../entities/Activity";
import { AuthRequest } from "../middleware/auth";
import { socketHandler } from "../socket";

const activityRepository = AppDataSource.getRepository(Activity);

export const getUnreadNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const activities = await activityRepository.find({
      where: {
        task: {
          assignee: { id: req.user!.id },
        },
        read: false,
      },
      relations: ["user", "task"],
      order: {
        timestamp: "DESC",
      },
      take: 10,
    });

    res.json(activities);
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { activityId } = req.params;

    const activity = await activityRepository.findOne({
      where: { id: parseInt(activityId) },
      relations: ["user", "task", "task.assignee"],
    });

    if (!activity) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    // Verificar que la notificación pertenece al usuario actual
    if (activity.task?.assignee?.id !== req.user!.id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Marcar como leída
    activity.read = true;
    await activityRepository.save(activity);

    // Emitir evento de Socket.io
    const socket = socketHandler(req.app.get("io"));
    socket.emitNotificationRead(activity);

    res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getNotificationCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await activityRepository.count({
      where: {
        task: {
          assignee: { id: req.user!.id },
        },
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error obteniendo contador de notificaciones:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
