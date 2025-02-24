import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getDashboardData } from "../controllers/dashboard.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/", getDashboardData as RequestHandler);

export default router;
