import { Response } from "express";
import { AppDataSource } from "../data-source";
import { TaskStatus } from "../entities/TaskStatus";
import { AuthRequest } from "../middleware/auth";

const taskStatusRepository = AppDataSource.getRepository(TaskStatus);

export const getTaskStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const statuses = await taskStatusRepository.find({
      order: {
        order: "ASC",
      },
    });
    res.json(statuses);
  } catch (error) {
    console.error("Error obteniendo estados:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const createTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({
        message: "Nombre y color son requeridos",
      });
    }

    // Verificar si ya existe un estado con el mismo nombre
    const existingStatus = await taskStatusRepository.findOne({
      where: { name },
    });

    if (existingStatus) {
      return res.status(400).json({
        message: "Ya existe un estado con ese nombre",
      });
    }

    // Obtener el último orden
    const lastStatus = await taskStatusRepository.findOne({
      where: {},
      order: { order: "DESC" },
    });
    const newOrder = lastStatus ? lastStatus.order + 1 : 0;

    const status = taskStatusRepository.create({
      name,
      color,
      order: newOrder,
    });

    const savedStatus = await taskStatusRepository.save(status);
    console.log("Estado creado exitosamente:", savedStatus);
    res.status(201).json(savedStatus);
  } catch (error) {
    console.error("Error detallado creando estado:", error);
    res.status(500).json({
      message: "Error en el servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, order } = req.body;

    const status = await taskStatusRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["tasks"],
    });

    if (!status) {
      return res.status(404).json({ message: "Estado no encontrado" });
    }

    if (name) status.name = name;
    if (color) status.color = color;
    if (typeof order === "number") status.order = order;

    const updatedStatus = await taskStatusRepository.save(status);

    // Obtener el estado actualizado con todas sus relaciones
    const statusWithRelations = await taskStatusRepository.findOne({
      where: { id: updatedStatus.id },
      relations: ["tasks"],
    });

    // Emitir evento de Socket.io con los datos completos
    const io = req.app.get("io");
    io.emit("statusUpdated", statusWithRelations);

    res.json(statusWithRelations);
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const deleteTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const status = await taskStatusRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["tasks"],
    });

    if (!status) {
      return res.status(404).json({ message: "Estado no encontrado" });
    }

    // Verificar si es un estado predeterminado
    const defaultStatuses = ["Pendiente", "En Progreso", "Completada"];
    if (defaultStatuses.includes(status.name)) {
      return res.status(400).json({
        message: "No se pueden eliminar los estados predeterminados",
      });
    }

    // Si tiene tareas asignadas, no permitir la eliminación
    if (status.tasks && status.tasks.length > 0) {
      return res.status(400).json({
        message: "No se puede eliminar un estado que tiene tareas asignadas",
      });
    }

    await taskStatusRepository.remove(status);

    // Emitir evento de Socket.io
    const io = req.app.get("io");
    io.emit("statusDeleted", id);

    res.json({ message: "Estado eliminado exitosamente" });
  } catch (error) {
    console.error("Error eliminando estado:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const reorderTaskStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.status(400).json({
        message: "El formato de la solicitud es inválido",
      });
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      for (const item of orders) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(TaskStatus)
          .set({ order: item.order })
          .where("id = :id", { id: item.id })
          .execute();
      }
    });

    const updatedStatuses = await taskStatusRepository.find({
      order: { order: "ASC" },
    });

    res.json(updatedStatuses);
  } catch (error) {
    console.error("Error reordenando estados:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
