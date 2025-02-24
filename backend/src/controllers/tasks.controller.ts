import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Task } from "../entities/Task";
import { Comment } from "../entities/Comment";
import { Activity, ActivityType } from "../entities/Activity";
import { AuthRequest } from "../middleware/auth";
import { TaskStatus } from "../entities/TaskStatus";
import { User } from "../entities/User";
import { DeepPartial } from "typeorm";

const taskRepository = AppDataSource.getRepository(Task);
const commentRepository = AppDataSource.getRepository(Comment);
const activityRepository = AppDataSource.getRepository(Activity);
const taskStatusRepository = AppDataSource.getRepository(TaskStatus);
const userRepository = AppDataSource.getRepository(User);

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const tasks = await taskRepository.find({
      where: [{ assignee: { id: userId } }, { user: { id: userId } }],
      relations: ["assignee", "comments", "comments.user", "status", "user"],
      order: {
        createdAt: "DESC",
      },
    });
    res.json(tasks);
  } catch (error) {
    console.error("Error obteniendo tareas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getTaskStats = async (req: AuthRequest, res: Response) => {
  try {
    const tasksByStatus = await taskStatusRepository
      .createQueryBuilder("status")
      .leftJoinAndSelect("status.tasks", "task")
      .select(["status.name", "status.color", "COUNT(task.id) as count"])
      .groupBy("status.id")
      .getRawMany();

    res.json(tasksByStatus);
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getRecentTasks = async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await taskRepository.find({
      relations: ["assignee"],
      order: {
        createdAt: "DESC",
      },
      take: 5,
    });
    res.json(tasks);
  } catch (error) {
    console.error("Error obteniendo tareas recientes:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate, assigneeId, statusId } = req.body;

    if (!title || !description || !dueDate || !statusId) {
      return res.status(400).json({
        message: "Todos los campos son requeridos",
      });
    }

    const status = await taskStatusRepository.findOne({
      where: { id: statusId },
    });

    if (!status) {
      return res.status(404).json({ message: "Estado no encontrado" });
    }

    let assignee: DeepPartial<User> | undefined = undefined;
    if (assigneeId) {
      const user = await userRepository.findOne({
        where: { id: assigneeId },
      });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      assignee = { id: user.id };
    }

    const taskData: DeepPartial<Task> = {
      title,
      description,
      dueDate: new Date(dueDate),
      status,
      assignee,
      user: { id: req.user.id },
    };

    const task = taskRepository.create(taskData);
    await taskRepository.save(task);

    // Crear actividad
    const activity = activityRepository.create({
      type: ActivityType.TASK_CREATED,
      description: `Tarea "${task.title}" creada`,
      user: { id: req.user.id },
      task,
    });

    await activityRepository.save(activity);

    // Obtener la tarea con sus relaciones
    const savedTask = await taskRepository.findOne({
      where: { id: task.id },
      relations: ["assignee", "status", "user"],
    });

    // Emitir evento de Socket.io
    const io = req.app.get("io");
    io.emit("taskCreated", savedTask);

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creando tarea:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await taskRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["status", "assignee"],
    });

    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    // Si se está actualizando el estado
    if (updates.statusId) {
      const newStatus = await taskStatusRepository.findOne({
        where: { id: updates.statusId },
      });
      if (!newStatus) {
        return res.status(404).json({ message: "Estado no encontrado" });
      }
      task.status = newStatus;
      delete updates.statusId;

      // Crear actividad de cambio de estado
      const activity = activityRepository.create({
        type: ActivityType.STATUS_CHANGED,
        description: `Estado de la tarea "${task.title}" cambiado a ${newStatus.name}`,
        user: req.user,
        task,
      });
      await activityRepository.save(activity);
    }

    // Si se está actualizando el asignado
    if (updates.assigneeId !== undefined) {
      if (updates.assigneeId === null) {
        task.assignee = null;
      } else {
        const assignee = await userRepository.findOne({
          where: { id: updates.assigneeId },
        });
        if (!assignee) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }
        task.assignee = assignee;
      }
      delete updates.assigneeId;

      // Crear actividad de cambio de asignación
      const activity = activityRepository.create({
        type: ActivityType.ASSIGNEE_CHANGED,
        description: `Asignación de la tarea "${task.title}" actualizada`,
        user: req.user,
        task,
      });
      await activityRepository.save(activity);
    }

    // Actualizar otros campos
    if (updates.title) task.title = updates.title;
    if (updates.description) task.description = updates.description;
    if (updates.dueDate) task.dueDate = new Date(updates.dueDate);

    await taskRepository.save(task);

    // Obtener la tarea actualizada con sus relaciones
    const updatedTask = await taskRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["assignee", "status"],
    });

    // Emitir evento de Socket.io
    const io = req.app.get("io");
    io.emit("taskUpdated", updatedTask);

    res.json(updatedTask);
  } catch (error) {
    console.error("Error actualizando tarea:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "El texto del comentario es requerido",
      });
    }

    const task = await taskRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["comments", "comments.user"],
    });

    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    const comment = commentRepository.create({
      text: text.trim(),
      user: req.user,
      task,
    });

    await commentRepository.save(comment);

    // Obtener el comentario con todas sus relaciones
    const savedComment = await commentRepository.findOne({
      where: { id: comment.id },
      relations: ["user", "task"],
    });

    if (!savedComment) {
      throw new Error("Error al guardar el comentario");
    }

    // Crear actividad
    const activity = activityRepository.create({
      type: ActivityType.COMMENT_ADDED,
      description: `Comentario agregado a la tarea "${task.title}"`,
      user: req.user,
      task,
    });

    await activityRepository.save(activity);

    // Emitir eventos de Socket.io
    const io = req.app.get("io");
    io.emit("commentAdded", { taskId: task.id, comment: savedComment });
    io.emit("activityCreated", activity);

    res.status(201).json(savedComment);
  } catch (error) {
    console.error("Error agregando comentario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await taskRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["user", "assignee"],
    });

    if (!task) {
      return res.status(404).json({ message: "Tarea no encontrada" });
    }

    // Verificar que el usuario es el creador o el asignado
    if (task.user.id !== req.user.id && task.assignee?.id !== req.user.id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    // Crear actividad antes de eliminar la tarea
    const activity = activityRepository.create({
      type: ActivityType.TASK_DELETED,
      description: `Tarea "${task.title}" eliminada`,
      user: req.user,
      task,
    });

    await activityRepository.save(activity);
    await taskRepository.remove(task);

    // Emitir eventos de Socket.io
    const io = req.app.get("io");
    io.emit("taskDeleted", id);
    io.emit("activityCreated", activity);

    res.json({ message: "Tarea eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
