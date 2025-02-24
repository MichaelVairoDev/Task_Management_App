import { Router } from "express";
import { register, login, getMe, checkAuth } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";
import { TypedRequestHandler } from "../types/express";

const router = Router();

router.post("/register", register as TypedRequestHandler);
router.post("/login", login as TypedRequestHandler);
router.get("/me", authMiddleware, getMe as TypedRequestHandler);
router.get("/check", authMiddleware, checkAuth as TypedRequestHandler);

export default router;
