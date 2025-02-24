import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getSystemStats, getUserStats } from "../controllers/stats.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/system", getSystemStats as RequestHandler);
router.get("/user", getUserStats as RequestHandler);

export default router;
