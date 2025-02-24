import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  getTaskStats,
  getRecentTasks,
} from "../controllers/tasks.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Rutas de tareas
router.get("/", getTasks as RequestHandler);
router.get("/stats", getTaskStats as RequestHandler);
router.get("/recent", getRecentTasks as RequestHandler);
router.post("/", createTask as RequestHandler);
router.patch("/:id", updateTask as RequestHandler);
router.delete("/:id", deleteTask as RequestHandler);
router.post("/:id/comments", addComment as RequestHandler);

export default router;
