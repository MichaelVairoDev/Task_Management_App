import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

export type AuthRequest = Request & {
  user: User;
};

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("No se proporcionó token de autenticación");
      return res.status(401).json({
        message: "No se proporcionó token de autenticación",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("Formato de token inválido");
      return res.status(401).json({
        message: "Formato de token inválido",
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.id } });

      if (!user) {
        console.log("Usuario no encontrado");
        return res.status(401).json({
          message: "Usuario no encontrado",
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.log("Token inválido:", jwtError);
      return res.status(401).json({
        message: "Token inválido",
      });
    }
  } catch (error) {
    console.error("Error en middleware de autenticación:", error);
    return res.status(500).json({
      message: "Error en el servidor",
    });
  }
};
