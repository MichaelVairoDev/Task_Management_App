import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  generateTaskReport,
  generateUserActivityReport,
  generateSystemReport,
} from "../controllers/reports.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/tasks", generateTaskReport as RequestHandler);
router.get("/users", generateUserActivityReport as RequestHandler);
router.get("/system", generateSystemReport as RequestHandler);

export default router;
