import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Todos los campos son requeridos",
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: "El email ya está registrado",
      });
    }

    // Crear nuevo usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    await userRepository.save(user);

    // Generar token
    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    // Excluir password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Error en el registro:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y contraseña son requeridos",
      });
    }

    // Buscar usuario
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    // Generar token
    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    // Excluir password de la respuesta
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // Excluir password de la respuesta
    const { password: _, ...userWithoutPassword } = req.user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const checkAuth = async (req: AuthRequest, res: Response) => {
  try {
    const user = await userRepository.findOne({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error verificando autenticación:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};
