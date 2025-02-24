import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase, AppDataSource } from "./data-source";
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import userRoutes from "./routes/users";
import activityRoutes from "./routes/activity";
import dashboardRoutes from "./routes/dashboard";
import notificationRoutes from "./routes/notifications";
import statsRoutes from "./routes/stats";
import reportsRoutes from "./routes/reports";
import taskStatusRoutes from "./routes/taskStatus";
import { socketHandler } from "./socket";

dotenv.config();

const app = express();
const httpServer = createServer(app);
let io: Server;

// Middleware de logging para desarrollo
if (process.env.NODE_ENV !== "production") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

// Middleware de seguridad básica
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Configuración de CORS más segura
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 600, // 10 minutos
};

app.use(cors(corsOptions));

// Middleware de timeout
const timeout = require("connect-timeout");
app.use(timeout("45s"));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/task-status", taskStatusRoutes);

// Middleware de manejo de errores mejorado
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
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
  }
);

const PORT = parseInt(process.env.PORT || "3001");

// Función para inicializar Socket.IO
const initializeSocketIO = () => {
  io = new Server(httpServer, {
    cors: corsOptions,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Configurar Socket.IO
  io.on("connect_error", (err) => {
    console.error("Socket.IO connection error:", err);
  });

  socketHandler(io);
  app.set("io", io);
};

// Función para el apagado graceful
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} recibido. Iniciando apagado graceful...`);

  // Cerrar servidor HTTP
  httpServer.close(() => {
    console.log("Servidor HTTP cerrado.");
  });

  // Desconectar todos los clientes Socket.IO
  if (io) {
    io.close(() => {
      console.log("Conexiones Socket.IO cerradas.");
    });
  }

  // Cerrar conexión con la base de datos
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Conexión a la base de datos cerrada.");
    }
  } catch (error) {
    console.error("Error al cerrar la conexión con la base de datos:", error);
  }

  // Salir del proceso después de un timeout
  setTimeout(() => {
    console.log("Apagado graceful completado.");
    process.exit(0);
  }, 3000);
};

// Iniciar el servidor
const startServer = async () => {
  try {
    // Inicializar la base de datos con reintentos
    const dbInitialized = await initializeDatabase(10, 3000);
    if (!dbInitialized) {
      throw new Error(
        "No se pudo inicializar la base de datos después de varios intentos"
      );
    }

    // Inicializar Socket.IO
    initializeSocketIO();

    // Iniciar el servidor HTTP
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`
=================================================
🚀 Servidor iniciado exitosamente
📡 Puerto: ${PORT}
🌎 Modo: ${process.env.NODE_ENV || "development"}
=================================================
      `);
    });

    // Manejar señales de terminación
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Manejar errores no capturados
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });
  } catch (error) {
    console.error("Error fatal al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
