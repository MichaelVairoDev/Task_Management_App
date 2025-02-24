import { Server } from "socket.io";
import { Task } from "./entities/Task";
import { Comment } from "./entities/Comment";
import { Activity } from "./entities/Activity";

export const socketHandler = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("Cliente conectado:", socket.id);

    socket.on("disconnect", () => {
      console.log("Cliente desconectado:", socket.id);
    });

    // Unirse a una sala específica de tarea
    socket.on("joinTask", (taskId: number) => {
      socket.join(`task-${taskId}`);
    });

    // Dejar una sala específica de tarea
    socket.on("leaveTask", (taskId: number) => {
      socket.leave(`task-${taskId}`);
    });

    // Unirse a la sala de actividades del usuario
    socket.on("joinUserActivity", (userId: number) => {
      socket.join(`user-${userId}`);
    });

    // Dejar la sala de actividades del usuario
    socket.on("leaveUserActivity", (userId: number) => {
      socket.leave(`user-${userId}`);
    });

    // Unirse a la sala de notificaciones del usuario
    socket.on("joinNotifications", (userId: number) => {
      socket.join(`notifications-${userId}`);
    });

    // Dejar la sala de notificaciones del usuario
    socket.on("leaveNotifications", (userId: number) => {
      socket.leave(`notifications-${userId}`);
    });
  });

  // Métodos para emitir eventos
  return {
    emitTaskCreated: (task: Task) => {
      io.emit("taskCreated", task);
    },

    emitTaskUpdated: (task: Task) => {
      io.emit("taskUpdated", task);
      io.to(`task-${task.id}`).emit("taskDetailUpdated", task);
    },

    emitCommentAdded: (taskId: number, comment: Comment) => {
      io.to(`task-${taskId}`).emit("commentAdded", { taskId, comment });
    },

    emitActivityCreated: (activity: Activity) => {
      io.emit("activityCreated", activity);
      if (activity.user) {
        io.to(`user-${activity.user.id}`).emit("userActivityCreated", activity);
      }
      if (activity.task) {
        io.to(`task-${activity.task.id}`).emit("taskActivityCreated", activity);
        if (activity.task.assignee) {
          io.to(`notifications-${activity.task.assignee.id}`).emit(
            "newNotification",
            activity
          );
        }
      }
    },

    emitNotificationRead: (activity: Activity) => {
      if (activity.task?.assignee) {
        io.to(`notifications-${activity.task.assignee.id}`).emit(
          "notificationRead",
          activity
        );
      }
    },
  };
};
