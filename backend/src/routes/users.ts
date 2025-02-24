import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getUsers, updateUser } from "../controllers/users.controller";
import { RequestHandler } from "../types/express";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get("/", getUsers as RequestHandler);
router.patch("/:id", updateUser as RequestHandler);

export default router;
