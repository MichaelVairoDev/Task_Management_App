import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "./entities/User";
import { Task } from "./entities/Task";
import { Comment } from "./entities/Comment";
import { Activity } from "./entities/Activity";
import { TaskStatus } from "./entities/TaskStatus";
import dotenv from "dotenv";
import * as bcrypt from "bcryptjs";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

// Asegurarse de que las variables de entorno estén disponibles
console.log("Database Configuration:", {
  host: process.env.DB_HOST || "db",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  database: process.env.DB_DATABASE || "taskdb",
});

const config: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "db",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "taskdb",
  synchronize: !isProd, // Solo sincronizar en desarrollo
  logging: !isProd,
  entities: [User, Task, Comment, Activity, TaskStatus],
  migrations: [],
  subscribers: [],
  connectTimeoutMS: 20000,
  maxQueryExecutionTime: 10000,
  extra: {
    max: 20,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
        /ConnectionError/,
        /ConnectionRefusedError/,
        /HostNotFoundError/,
        /HostNotReachableError/,
        /InvalidConnectionError/,
        /ConnectionTimedOutError/,
      ],
      max: 5,
    },
  },
};

export const AppDataSource = new DataSource(config);

export const initializeDatabase = async (
  retries = 10,
  delay = 3000
): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Si ya está inicializada, intentar hacer una consulta de prueba
      if (AppDataSource.isInitialized) {
        try {
          await AppDataSource.query("SELECT 1");
          console.log("Conexión a la base de datos verificada");
          return true;
        } catch (error) {
          console.log("Error en la conexión existente, reiniciando...");
          await AppDataSource.destroy();
        }
      }

      // Inicializar la conexión
      await AppDataSource.initialize();
      console.log("Base de datos conectada exitosamente");

      // Usar transacción para la creación de datos iniciales
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Crear estados de tarea por defecto
        const defaultStatuses = [
          { name: "Pendiente", color: "#FFB020", order: 0 },
          { name: "En Progreso", color: "#3E79F7", order: 1 },
          { name: "Completada", color: "#4CAF50", order: 2 },
        ];

        for (const status of defaultStatuses) {
          const existingStatus = await transactionalEntityManager.findOne(
            TaskStatus,
            {
              where: { name: status.name },
            }
          );

          if (!existingStatus) {
            await transactionalEntityManager.save(TaskStatus, status);
            console.log(`Estado "${status.name}" creado exitosamente`);
          }
        }

        // Crear usuario admin por defecto
        const adminUser = await transactionalEntityManager.findOne(User, {
          where: { email: "admin@example.com" },
        });

        if (!adminUser) {
          const hashedPassword = await bcrypt.hash("admin123", 10);
          const newAdmin = transactionalEntityManager.create(User, {
            name: "Admin",
            email: "admin@example.com",
            password: hashedPassword,
          });

          await transactionalEntityManager.save(User, newAdmin);
          console.log("Usuario administrador creado exitosamente");
        }
      });

      return true;
    } catch (err) {
      const error = err as Error;
      console.error(`Intento ${i + 1}/${retries} de conexión fallido:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      if (AppDataSource.isInitialized) {
        try {
          await AppDataSource.destroy();
        } catch (destroyError) {
          console.error("Error al cerrar la conexión:", destroyError);
        }
      }

      if (i < retries - 1) {
        const waitTime = delay * Math.pow(1.5, i); // Backoff exponencial
        console.log(`Reintentando en ${waitTime / 1000} segundos...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }
  return false;
};
