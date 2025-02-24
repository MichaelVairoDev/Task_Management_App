import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getUnreadNotifications,
  markNotificationAsRead,
  getNotificationCount,
} from "../controllers/notification.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/unread", getUnreadNotifications as RequestHandler);
router.get("/count", getNotificationCount as RequestHandler);
router.post("/:activityId/read", markNotificationAsRead as RequestHandler);

export default router;
