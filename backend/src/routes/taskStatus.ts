import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getTaskStatuses,
  createTaskStatus,
  updateTaskStatus,
  deleteTaskStatus,
  reorderTaskStatuses,
} from "../controllers/taskStatus.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/", getTaskStatuses as RequestHandler);
router.post("/", createTaskStatus as RequestHandler);
router.put("/:id", updateTaskStatus as RequestHandler);
router.delete("/:id", deleteTaskStatus as RequestHandler);
router.post("/reorder", reorderTaskStatuses as RequestHandler);

export default router;
