import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getRecentActivity,
  getUserActivity,
  getTaskActivity,
} from "../controllers/activity.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/recent", getRecentActivity as RequestHandler);
router.get("/user", getUserActivity as RequestHandler);
router.get("/task/:taskId", getTaskActivity as RequestHandler);

export default router;
