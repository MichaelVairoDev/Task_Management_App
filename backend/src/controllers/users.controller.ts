import { Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await userRepository.find({
      select: ["id", "name", "email", "createdAt"],
    });
    res.json(users);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Solo permitir actualizar el propio perfil
    if (parseInt(id) !== req.user?.id) {
      return res.status(403).json({ message: "No autorizado" });
    }

    const user = await userRepository.findOne({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // No permitir actualizar el email o la contraseña por esta ruta
    delete updates.email;
    delete updates.password;

    userRepository.merge(user, updates);
    await userRepository.save(user);

    // Excluir password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
