<template>
  <div class="tasks-container">
    <div class="tasks-header">
      <h1>Gestión de Tareas</h1>
      <div class="header-buttons">
        <Button
          icon="pi pi-plus"
          label="Nuevo Estado"
          class="p-button-secondary mr-2"
          @click="openNewStatusDialog"
        />
        <Button
          icon="pi pi-plus"
          label="Nueva Tarea"
          @click="openNewTaskDialog"
        />
      </div>
    </div>

    <!-- Dialog para crear nuevo estado -->
    <Dialog
      v-model:visible="newStatusDialog"
      header="Nuevo Estado"
      :modal="true"
      class="p-fluid"
    >
      <div class="field">
        <label for="statusName">Nombre</label>
        <InputText
          id="statusName"
          v-model="newStatus.name"
          required
          autofocus
        />
      </div>
      <div class="field">
        <label for="statusColor">Color</label>
        <ColorPicker v-model="newStatus.color" />
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-text"
          @click="closeNewStatusDialog"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          class="p-button-text"
          :loading="loading"
          @click="createStatus"
        />
      </template>
    </Dialog>

    <!-- Dialog para crear nueva tarea -->
    <Dialog
      v-model:visible="newTaskDialog"
      header="Nueva Tarea"
      :modal="true"
      class="p-fluid"
    >
      <div class="field">
        <label for="title">Título</label>
        <InputText id="title" v-model="newTask.title" required />
      </div>
      <div class="field">
        <label for="description">Descripción</label>
        <Textarea
          id="description"
          v-model="newTask.description"
          rows="3"
          required
        />
      </div>
      <div class="field">
        <label for="dueDate">Fecha de Vencimiento</label>
        <Calendar
          id="dueDate"
          v-model="newTask.dueDate"
          dateFormat="dd/mm/yy"
          :showTime="true"
          required
        />
      </div>
      <div class="field">
        <label for="status">Estado</label>
        <Dropdown
          id="status"
          v-model="newTask.statusId"
          :options="taskStatuses"
          optionLabel="name"
          optionValue="id"
          placeholder="Seleccione un estado"
          required
        />
      </div>
      <div class="field">
        <label for="assignee">Asignar a</label>
        <Dropdown
          id="assignee"
          v-model="newTask.assigneeId"
          :options="users"
          optionLabel="name"
          optionValue="id"
          placeholder="Seleccione un usuario"
          :loading="loadingUsers"
          :disabled="loadingUsers || users.length === 0"
        />
        <small v-if="usersError" class="p-error">{{ usersError }}</small>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-text"
          @click="closeNewTaskDialog"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          class="p-button-text"
          :loading="loading"
          @click="createTask"
        />
      </template>
    </Dialog>

    <div class="tasks-grid">
      <!-- Columnas dinámicas basadas en estados -->
      <div
        v-for="(status, index) in taskStatuses"
        :key="status.id"
        class="task-column"
        :class="{ 'drag-over': isDraggingOver === status.id }"
        :style="{
          borderColor: status.color,
          borderLeftColor: status.color,
          borderLeftWidth: '4px',
        }"
        @dragover="onDragOver($event, status)"
        @dragleave="onDragLeave(status)"
        @drop="onDrop($event, status)"
      >
        <div class="status-header">
          <h3>{{ status.name }}</h3>
          <div class="status-actions">
            <Button
              icon="pi pi-pencil"
              class="p-button-text p-button-sm"
              @click="openEditStatusDialog(status)"
            />
            <Button
              v-if="!isDefaultStatus(status.name)"
              icon="pi pi-trash"
              class="p-button-text p-button-danger p-button-sm"
              @click="confirmDeleteStatus(status)"
              :disabled="hasTasksInStatus(status)"
            />
            <i
              class="pi pi-bars"
              style="cursor: move"
              @mousedown="startDragStatus(index)"
            ></i>
          </div>
        </div>
        <div class="task-list">
          <div
            v-for="task in tasks.filter((t) => t.status.id === status.id)"
            :key="task.id"
            class="task-card"
            :class="{ dragging: isDragging === task.id }"
            :style="{
              borderColor: status.color,
              borderLeftColor: status.color,
              borderLeftWidth: '4px',
            }"
            draggable="true"
            @dragstart="onDragStart($event, task)"
            @dragend="onDragEnd"
            @click="openTaskDetails(task)"
          >
            <div class="task-header">
              <span class="task-title">{{ task.title }}</span>
              <Tag
                :value="task.status.name"
                :style="{ backgroundColor: task.status.color }"
              />
            </div>
            <p class="task-description">{{ task.description }}</p>
            <div class="task-footer">
              <span class="due-date">
                <i class="pi pi-calendar"></i>
                {{ new Date(task.dueDate).toLocaleDateString() }}
              </span>
              <Avatar
                v-if="task.assignee"
                :label="getInitials(task.assignee.name)"
                shape="circle"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Diálogo de Detalles de Tarea -->
    <Dialog
      v-model:visible="taskDetailsDialog"
      :header="selectedTask?.title"
      :modal="true"
      class="task-dialog p-fluid"
    >
      <div v-if="selectedTask" class="task-details">
        <div class="detail-group">
          <h4>Estado</h4>
          <Dropdown
            v-model="selectedTask.status.id"
            :options="taskStatuses"
            optionLabel="name"
            optionValue="id"
            @change="updateTaskStatus"
            class="w-full"
          />
        </div>

        <div class="detail-group">
          <h4>Descripción</h4>
          <div class="description-box">
            {{ selectedTask.description }}
          </div>
        </div>

        <div class="detail-group">
          <h4>Fecha Límite</h4>
          <Calendar
            v-model="selectedTask.dueDate"
            dateFormat="dd/mm/yy"
            :showTime="true"
            @change="updateTaskDueDate"
            class="w-full"
          />
        </div>

        <div class="detail-group">
          <h4>Asignado a</h4>
          <Dropdown
            v-model="selectedTask.assigneeId"
            :options="users"
            optionLabel="name"
            optionValue="id"
            @change="updateTaskAssignee"
            placeholder="Seleccionar usuario"
            class="w-full"
          />
        </div>

        <div class="detail-group">
          <h4>Comentarios</h4>
          <div class="comments-section">
            <div
              v-for="comment in selectedTask.comments"
              :key="comment.id"
              class="comment"
            >
              <div class="comment-header">
                <Avatar
                  :label="getInitials(comment.user.name)"
                  shape="circle"
                  size="small"
                />
                <span class="comment-author">{{ comment.user.name }}</span>
                <span class="comment-time">
                  {{ new Date(comment.createdAt).toLocaleString() }}
                </span>
              </div>
              <p class="comment-text">{{ comment.text }}</p>
            </div>
          </div>
          <div class="new-comment">
            <InputText
              v-model="newComment"
              placeholder="Escribe un comentario..."
              @keyup.enter="addComment"
              class="w-full"
            />
            <Button
              icon="pi pi-send"
              @click="addComment"
              class="p-button-text"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Dialog para editar estado -->
    <Dialog
      v-model:visible="editStatusDialog"
      header="Editar Estado"
      :modal="true"
      class="p-fluid"
    >
      <div class="field">
        <label for="editStatusName">Nombre</label>
        <InputText
          id="editStatusName"
          v-model="editingStatus.name"
          required
          autofocus
        />
      </div>
      <div class="field">
        <label for="editStatusColor">Color</label>
        <ColorPicker v-model="editingStatus.color" />
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-text"
          @click="closeEditStatusDialog"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          class="p-button-text"
          :loading="loading"
          @click="updateStatus"
        />
      </template>
    </Dialog>

    <!-- Diálogo de confirmación para eliminar estado -->
    <Dialog
      v-model:visible="deleteStatusDialog"
      header="Confirmar Eliminación"
      :modal="true"
    >
      <p>¿Está seguro que desea eliminar este estado?</p>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          class="p-button-text"
          @click="deleteStatusDialog = false"
        />
        <Button
          label="Sí"
          icon="pi pi-check"
          class="p-button-text p-button-danger"
          :loading="loading"
          @click="deleteStatus"
        />
      </template>
    </Dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from "vue";
import { useAuthStore } from "../stores/auth";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Calendar from "primevue/calendar";
import Dropdown from "primevue/dropdown";
import Tag from "primevue/tag";
import Avatar from "primevue/avatar";
import axios from "axios";
import { io } from "socket.io-client";
import ColorPicker from "primevue/colorpicker";

interface TaskStatus {
  id: number;
  name: string;
  color: string;
  order: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: Date;
  assigneeId: number | null;
  assignee?: User;
  comments: Comment[];
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  user: User;
}

export default defineComponent({
  name: "Tasks",
  components: {
    Button,
    Dialog,
    InputText,
    Textarea,
    Calendar,
    Dropdown,
    Tag,
    Avatar,
    ColorPicker,
  },
  setup() {
    const authStore = useAuthStore();
    const socket = io(import.meta.env.VITE_API_URL);

    const tasks = ref<Task[]>([]);
    const users = ref<User[]>([]);
    const taskStatuses = ref<TaskStatus[]>([]);
    const loading = ref(false);
    const loadingUsers = ref(false);
    const usersError = ref("");
    const newTaskDialog = ref(false);
    const taskDetailsDialog = ref(false);
    const selectedTask = ref<Task | null>(null);
    const newComment = ref("");
    const isDragging = ref<number | null>(null);
    const isDraggingOver = ref<number | null>(null);

    const newTask = ref({
      title: "",
      description: "",
      dueDate: null as Date | null,
      assigneeId: null as number | null,
      statusId: null as number | null,
    });

    const pendingTasks = computed(() =>
      tasks.value.filter((task) => task.status.name === "Pendiente")
    );

    const inProgressTasks = computed(() =>
      tasks.value.filter((task) => task.status.name === "En Progreso")
    );

    const completedTasks = computed(() =>
      tasks.value.filter((task) => task.status.name === "Completada")
    );

    const getInitials = (name: string) => {
      if (!name) return "";
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    };

    const loadTaskStatuses = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/task-status`,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        taskStatuses.value = response.data.map((status: TaskStatus) => ({
          ...status,
        }));
      } catch (error) {
        console.error("Error cargando estados:", error);
      }
    };

    const loadTasks = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/tasks`
        );
        tasks.value = response.data.map((task: Task) => ({
          ...task,
          status: { ...task.status },
        }));
      } catch (error) {
        console.error("Error cargando tareas:", error);
      }
    };

    const loadUsers = async () => {
      loadingUsers.value = true;
      usersError.value = "";
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users`
        );
        users.value = response.data;
        if (users.value.length === 0) {
          usersError.value = "No hay usuarios disponibles para asignar tareas";
        }
      } catch (error: any) {
        console.error("Error cargando usuarios:", error);
        usersError.value =
          "Error al cargar los usuarios. Por favor, intente nuevamente.";
      } finally {
        loadingUsers.value = false;
      }
    };

    const openNewTaskDialog = () => {
      const pendingStatus = taskStatuses.value.find(
        (status) => status.name === "Pendiente"
      );
      newTask.value = {
        title: "",
        description: "",
        dueDate: null,
        assigneeId: null,
        statusId: pendingStatus?.id || null,
      };
      newTaskDialog.value = true;
    };

    const closeNewTaskDialog = () => {
      newTaskDialog.value = false;
    };

    const createTask = async () => {
      loading.value = true;
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/tasks`,
          newTask.value
        );
        closeNewTaskDialog();
      } catch (error) {
        console.error("Error creando tarea:", error);
      } finally {
        loading.value = false;
      }
    };

    const openTaskDetails = (task: Task) => {
      selectedTask.value = { ...task };
      taskDetailsDialog.value = true;
    };

    const updateTaskStatus = async () => {
      if (!selectedTask.value) return;
      try {
        const newStatus = taskStatuses.value.find(
          (status) => status.id === selectedTask.value?.status.id
        );

        if (!newStatus) return;

        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/tasks/${selectedTask.value.id}`,
          {
            statusId: newStatus.id,
          }
        );

        // Actualizar el estado de la tarea seleccionada
        selectedTask.value.status = { ...newStatus };

        // Actualizar la tarea en la lista de tareas
        const taskIndex = tasks.value.findIndex(
          (t) => t.id === selectedTask.value?.id
        );
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = {
            ...tasks.value[taskIndex],
            status: { ...newStatus },
          };
        }
      } catch (error) {
        console.error("Error actualizando estado:", error);
      }
    };

    const updateTaskDueDate = async () => {
      if (!selectedTask.value) return;
      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/tasks/${selectedTask.value.id}`,
          {
            dueDate: selectedTask.value.dueDate,
          }
        );
      } catch (error) {
        console.error("Error actualizando fecha:", error);
      }
    };

    const updateTaskAssignee = async () => {
      if (!selectedTask.value) return;
      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/tasks/${selectedTask.value.id}`,
          {
            assigneeId: selectedTask.value.assigneeId,
          }
        );
      } catch (error) {
        console.error("Error actualizando asignación:", error);
      }
    };

    const addComment = async () => {
      if (!selectedTask.value || !newComment.value.trim()) return;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/tasks/${
            selectedTask.value.id
          }/comments`,
          { text: newComment.value.trim() },
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        // Actualizar la lista de comentarios de la tarea seleccionada
        if (selectedTask.value) {
          selectedTask.value.comments.push(response.data);
        }

        // Actualizar la tarea en la lista principal
        const taskIndex = tasks.value.findIndex(
          (t) => t.id === selectedTask.value?.id
        );
        if (taskIndex !== -1) {
          tasks.value[taskIndex].comments.push(response.data);
        }

        newComment.value = "";
      } catch (error) {
        console.error("Error añadiendo comentario:", error);
      }
    };

    // Configurar Socket.IO una sola vez
    socket.on("taskCreated", (newTask: Task) => {
      const existingTask = tasks.value.find((t) => t.id === newTask.id);
      if (!existingTask) {
        tasks.value.push(newTask);
      }
    });

    socket.on("taskUpdated", (updatedTask: Task) => {
      const index = tasks.value.findIndex((t) => t.id === updatedTask.id);
      if (index !== -1) {
        tasks.value[index] = updatedTask;
      }
    });

    socket.on("statusUpdated", (updatedStatus: TaskStatus) => {
      const index = taskStatuses.value.findIndex(
        (s) => s.id === updatedStatus.id
      );
      if (index !== -1) {
        taskStatuses.value[index] = { ...updatedStatus };

        // Actualizar las tareas que tienen este estado
        tasks.value = tasks.value.map((task) => {
          if (task.status.id === updatedStatus.id) {
            return {
              ...task,
              status: { ...updatedStatus },
            };
          }
          return task;
        });

        // Si hay una tarea seleccionada, actualizar su estado también
        if (
          selectedTask.value &&
          selectedTask.value.status.id === updatedStatus.id
        ) {
          selectedTask.value = {
            ...selectedTask.value,
            status: { ...updatedStatus },
          };
        }
      }
    });

    socket.on("statusDeleted", (deletedStatusId: number) => {
      taskStatuses.value = taskStatuses.value.filter(
        (status) => status.id !== deletedStatusId
      );
    });

    socket.on("commentAdded", ({ taskId, comment }) => {
      // Actualizar comentarios en la tarea seleccionada
      if (selectedTask.value && selectedTask.value.id === taskId) {
        selectedTask.value.comments.push(comment);
      }

      // Actualizar comentarios en la lista de tareas
      const task = tasks.value.find((t) => t.id === taskId);
      if (task) {
        task.comments.push(comment);
      }
    });

    // Drag & Drop handlers
    const onDragStart = (event: DragEvent, task: Task) => {
      if (event.dataTransfer) {
        isDragging.value = task.id;
        event.dataTransfer.setData("taskId", task.id.toString());
      }
    };

    const onDragEnd = () => {
      isDragging.value = null;
    };

    const onDragOver = (event: DragEvent, status: TaskStatus) => {
      event.preventDefault();
      isDraggingOver.value = status.id;
    };

    const onDragLeave = (status: TaskStatus) => {
      if (isDraggingOver.value === status.id) {
        isDraggingOver.value = null;
      }
    };

    const onDrop = async (event: DragEvent, status: TaskStatus) => {
      event.preventDefault();
      isDraggingOver.value = null;
      if (!event.dataTransfer) return;

      const taskId = parseInt(event.dataTransfer.getData("taskId"));
      const task = tasks.value.find((t) => t.id === taskId);
      if (!task || task.status.id === status.id) return;

      try {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`,
          {
            statusId: status.id,
          }
        );
      } catch (error) {
        console.error("Error actualizando estado:", error);
      }
    };

    // Función para abrir el diálogo de nuevo estado
    const newStatusDialog = ref(false);
    const newStatus = ref({
      name: "",
      color: "#ff9f43",
    });

    const openNewStatusDialog = () => {
      newStatus.value = {
        name: "",
        color: "#ff9f43",
      };
      newStatusDialog.value = true;
    };

    const closeNewStatusDialog = () => {
      newStatusDialog.value = false;
      newStatus.value = {
        name: "",
        color: "#ff9f43",
      };
    };

    const createStatus = async () => {
      if (!newStatus.value.name.trim()) {
        return;
      }

      loading.value = true;
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/task-status`,
          newStatus.value,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        taskStatuses.value.push(response.data);
        closeNewStatusDialog();
      } catch (error) {
        console.error("Error creando estado:", error);
      } finally {
        loading.value = false;
      }
    };

    const editStatusDialog = ref(false);
    const deleteStatusDialog = ref(false);
    const editingStatus = ref<TaskStatus | null>(null);
    const statusToDelete = ref<TaskStatus | null>(null);
    const draggedStatusIndex = ref<number | null>(null);

    const openEditStatusDialog = (status: TaskStatus) => {
      editingStatus.value = { ...status };
      editStatusDialog.value = true;
    };

    const closeEditStatusDialog = () => {
      editStatusDialog.value = false;
      editingStatus.value = null;
    };

    const updateStatus = async () => {
      if (!editingStatus.value) return;
      loading.value = true;
      try {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/task-status/${
            editingStatus.value.id
          }`,
          editingStatus.value,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        const updatedStatus = response.data;

        // Actualizar el estado en la lista de estados
        const index = taskStatuses.value.findIndex(
          (s) => s.id === updatedStatus.id
        );
        if (index !== -1) {
          taskStatuses.value[index] = { ...updatedStatus };

          // Actualizar las tareas que tienen este estado
          tasks.value = tasks.value.map((task) => {
            if (task.status.id === updatedStatus.id) {
              return {
                ...task,
                status: { ...updatedStatus },
              };
            }
            return task;
          });
        }

        closeEditStatusDialog();
      } catch (error) {
        console.error("Error actualizando estado:", error);
      } finally {
        loading.value = false;
      }
    };

    const confirmDeleteStatus = (status: TaskStatus) => {
      statusToDelete.value = status;
      deleteStatusDialog.value = true;
    };

    const deleteStatus = async () => {
      if (!statusToDelete.value) return;
      loading.value = true;
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/task-status/${
            statusToDelete.value.id
          }`,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
        taskStatuses.value = taskStatuses.value.filter(
          (s) => s.id !== statusToDelete.value?.id
        );
        deleteStatusDialog.value = false;
      } catch (error) {
        console.error("Error eliminando estado:", error);
      } finally {
        loading.value = false;
      }
    };

    const hasTasksInStatus = (status: TaskStatus) => {
      // Los estados por defecto no se pueden eliminar
      const defaultStatuses = ["Pendiente", "En Progreso", "Completada"];
      if (defaultStatuses.includes(status.name)) {
        return true; // Esto deshabilitará el botón de eliminar
      }
      return tasks.value.some((task) => task.status.id === status.id);
    };

    const startDragStatus = (index: number) => {
      draggedStatusIndex.value = index;
    };

    const reorderStatuses = async (
      newOrder: { id: number; order: number }[]
    ) => {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/task-status/reorder`,
          { orders: newOrder },
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );
      } catch (error) {
        console.error("Error reordenando estados:", error);
      }
    };

    const isDefaultStatus = (statusName: string) => {
      const defaultStatuses = ["Pendiente", "En Progreso", "Completada"];
      return defaultStatuses.includes(statusName);
    };

    onMounted(async () => {
      try {
        const isAuthenticated = await authStore.checkAuth();
        if (!isAuthenticated) {
          authStore.redirectToLogin();
          return;
        }

        // Solo cargar datos si está autenticado
        await Promise.all([loadTaskStatuses(), loadTasks(), loadUsers()]);
      } catch (error) {
        console.error("Error en la inicialización:", error);
        authStore.redirectToLogin();
      }
    });

    // Un solo onUnmounted para limpiar todos los event listeners y sockets
    onUnmounted(() => {
      socket.disconnect();
    });

    return {
      tasks,
      users,
      taskStatuses,
      loading,
      loadingUsers,
      usersError,
      newTaskDialog,
      taskDetailsDialog,
      selectedTask,
      newComment,
      newTask,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      getInitials,
      openNewTaskDialog,
      closeNewTaskDialog,
      createTask,
      openTaskDetails,
      updateTaskStatus,
      updateTaskDueDate,
      updateTaskAssignee,
      addComment,
      onDragStart,
      onDragEnd,
      onDragOver,
      onDragLeave,
      onDrop,
      newStatusDialog,
      newStatus,
      openNewStatusDialog,
      createStatus,
      isDragging,
      isDraggingOver,
      editStatusDialog,
      deleteStatusDialog,
      editingStatus,
      statusToDelete,
      openEditStatusDialog,
      closeEditStatusDialog,
      updateStatus,
      confirmDeleteStatus,
      deleteStatus,
      hasTasksInStatus,
      startDragStatus,
      isDefaultStatus,
    };
  },
});
</script>

<style scoped>
.tasks-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

.header-buttons .p-button {
  min-width: 150px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.task-column {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  min-height: 500px;
  transition: all 0.3s ease;
  cursor: default;
  border: 2px solid;
}

.task-column.drag-over {
  background-color: #e9ecef;
  transform: scale(1.01);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.task-column h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-card {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  cursor: move;
  transition: all 0.3s ease;
  user-select: none;
}

.task-card.dragging {
  opacity: 0.5;
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.task-title {
  font-weight: 600;
  color: #2c3e50;
}

.task-description {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.due-date {
  font-size: 0.8rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.task-dialog {
  max-width: 600px;
  width: 90vw;
}

.task-details {
  padding: 1rem;
}

.detail-group {
  margin-bottom: 2rem;
}

.detail-group h4 {
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.description-box {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  min-height: 80px;
  line-height: 1.5;
}

.comments-section {
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.comment {
  background: white;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comment:last-child {
  margin-bottom: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.comment-author {
  font-weight: 600;
  color: #2c3e50;
}

.comment-time {
  font-size: 0.85rem;
  color: #666;
  margin-left: auto;
}

.comment-text {
  margin: 0;
  color: #333;
  line-height: 1.5;
}

.new-comment {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
}

.new-comment .p-inputtext {
  flex: 1;
}

.field {
  margin-bottom: 1rem;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.status-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>
