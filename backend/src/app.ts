import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import timeout from "connect-timeout";
import { AppDataSource } from "./data-source";
import authRouter from "./routes/auth";
import tasksRouter from "./routes/tasks";
import usersRouter from "./routes/users";
import activityRouter from "./routes/activity";
import notificationsRouter from "./routes/notifications";
import reportsRouter from "./routes/reports";
import statsRouter from "./routes/stats";
import taskStatusRouter from "./routes/taskStatus";
import dashboardRouter from "./routes/dashboard";
import { Server } from "socket.io";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

// Configuración de CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600,
};

app.use(cors(corsOptions));

// Middleware
app.use(timeout("15s"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/users", usersRouter);
app.use("/api/activity", activityRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/task-status", taskStatusRouter);
app.use("/api/dashboard", dashboardRouter);

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware para compartir io con los controladores
app.set("io", io);

// Manejo de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    error: {
      message:
        process.env.NODE_ENV === "production"
          ? "Error interno del servidor"
          : err.message,
      timestamp: new Date().toISOString(),
    },
  });
});

// Inicializar la base de datos y el servidor
AppDataSource.initialize()
  .then(() => {
    console.log("Base de datos conectada");
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  })
  .catch((error) =>
    console.log("Error al inicializar la base de datos:", error)
  );

export { app, httpServer, io };
