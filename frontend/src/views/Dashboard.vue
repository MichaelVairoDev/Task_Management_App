<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <Dropdown
        v-model="selectedPeriod"
        :options="periods"
        optionLabel="label"
        optionValue="value"
        class="period-selector"
        @change="loadDashboardData"
      />
    </div>

    <div class="dashboard-grid">
      <!-- Resumen de Tareas -->
      <div class="dashboard-card task-summary">
        <h3>Resumen de Tareas</h3>
        <div class="summary-stats">
          <div
            v-for="status in taskStatuses"
            :key="status.id"
            class="stat-item"
            :style="{ borderColor: status.color }"
          >
            <span class="stat-value" :style="{ color: status.color }">
              {{ statusCounts[status.name] || 0 }}
            </span>
            <span class="stat-label">{{ status.name }}</span>
          </div>
        </div>
        <div class="completion-stats">
          <div class="completion-rate">
            <ProgressBar
              :value="additionalStats.completionRate"
              :showValue="true"
              :style="{ height: '20px' }"
            />
            <span class="completion-label">Tasa de Completitud</span>
          </div>
          <div class="overdue-tasks">
            <i class="pi pi-clock" style="color: #ff4081;"></i>
            <span>{{ additionalStats.overdueTasks }} tareas vencidas</span>
          </div>
        </div>
      </div>

      <!-- Gráfico de Tareas -->
      <div class="dashboard-card task-chart">
        <h3>Distribución de Tareas</h3>
        <Chart type="pie" :data="chartData" :options="chartOptions" />
      </div>

      <!-- Actividades Recientes -->
      <div class="dashboard-card recent-activities">
        <h3>Actividades Recientes</h3>
        <Timeline :value="recentActivities" class="custom-timeline">
          <template #content="slotProps">
            <div class="activity-item">
              <small class="activity-time">{{
                formatDate(slotProps.item.timestamp)
              }}</small>
              <p class="activity-text">{{ slotProps.item.description }}</p>
              <Tag
                v-if="slotProps.item.task?.status"
                :value="slotProps.item.task.status.name"
                :style="{ backgroundColor: slotProps.item.task.status.color }"
              />
            </div>
          </template>
        </Timeline>
      </div>

      <!-- Tareas Próximas -->
      <div class="dashboard-card upcoming-tasks">
        <h3>Tareas Próximas</h3>
        <div class="task-list">
          <div v-for="task in upcomingTasks" :key="task.id" class="task-item">
            <div class="task-info">
              <h4>{{ task.title }}</h4>
              <p>{{ task.description }}</p>
              <div class="task-meta">
                <Tag
                  :value="task.status.name"
                  :style="{ backgroundColor: task.status.color }"
                />
                <div class="task-details">
                  <span class="due-date">
                    <i class="pi pi-calendar"></i>
                    {{ formatDate(task.dueDate) }}
                  </span>
                  <span class="comments-count" v-if="task.comments">
                    <i class="pi pi-comments"></i>
                    {{ task.comments.length }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from "vue";
import Chart from "primevue/chart";
import Timeline from "primevue/timeline";
import Tag from "primevue/tag";
import Dropdown from "primevue/dropdown";
import ProgressBar from "primevue/progressbar";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { io } from "socket.io-client";

export default defineComponent({
  name: "Dashboard",
  components: {
    Chart,
    Timeline,
    Tag,
    Dropdown,
    ProgressBar,
  },
  setup() {
    const authStore = useAuthStore();
    const socket = io(import.meta.env.VITE_API_URL);
    const selectedPeriod = ref("today");
    const periods = ref([
      { label: "Hoy", value: "today" },
      { label: "Esta Semana", value: "week" },
      { label: "Este Mes", value: "month" },
    ]);

    const taskStatuses = ref<TaskStatus[]>([]);
    const statusCounts = ref<{ [key: string]: number }>({});
    const additionalStats = ref({
      overdueTasks: 0,
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
    });

    const chartData = ref({
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    });

    const chartOptions = ref({
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#495057",
            font: {
              size: 14,
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 20,
          left: 10,
          right: 10
        }
      }
    });

    const recentActivities = ref([]);
    const upcomingTasks = ref([]);

    const formatDate = (date: string) => {
      return new Date(date).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const loadDashboardData = async () => {
      try {
        const [statusesResponse, dashboardResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/task-status`, {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
            params: { period: selectedPeriod.value },
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }),
        ]);

        taskStatuses.value = statusesResponse.data;
        const {
          taskStats,
          recentActivities: activities,
          upcomingTasks: upcoming,
          additionalStats: stats,
        } = dashboardResponse.data;

        // Procesar estadísticas de tareas
        const counts: { [key: string]: number } = {};
        taskStats.forEach((stat: any) => {
          counts[stat.name] = parseInt(stat.count) || 0;
        });
        statusCounts.value = counts;
        additionalStats.value = stats;

        // Actualizar datos del gráfico
        chartData.value = {
          labels: taskStats.map((stat: any) => stat.name),
          datasets: [
            {
              data: taskStats.map((stat: any) => stat.count),
              backgroundColor: taskStats.map((stat: any) => stat.color),
            },
          ],
        };

        // Actualizar actividades y tareas próximas
        recentActivities.value = activities || [];
        upcomingTasks.value = upcoming || [];
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      }
    };

    // Socket.IO event listeners
    socket.on("taskCreated", loadDashboardData);
    socket.on("taskUpdated", loadDashboardData);
    socket.on("statusUpdated", loadDashboardData);
    socket.on("commentAdded", loadDashboardData);
    socket.on("activityCreated", loadDashboardData);

    onMounted(loadDashboardData);
    onUnmounted(() => {
      socket.disconnect();
    });

    return {
      selectedPeriod,
      periods,
      taskStatuses,
      statusCounts,
      additionalStats,
      chartData,
      chartOptions,
      recentActivities,
      upcomingTasks,
      formatDate,
      loadDashboardData,
    };
  },
});
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.period-selector {
  min-width: 150px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.dashboard-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.task-summary {
  grid-column: 1 / -1;
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  margin: 1.5rem 0;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid;
  min-width: 120px;
  transition: transform 0.2s;
}

.stat-item:hover {
  transform: translateY(-5px);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  display: block;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 1rem;
}

.completion-stats {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.completion-rate {
  margin-bottom: 1rem;
}

.completion-label {
  display: block;
  text-align: center;
  color: #666;
  margin-top: 0.5rem;
}

.overdue-tasks {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  color: #666;
}

.task-chart {
  height: 400px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.task-chart :deep(.p-chart) {
  height: calc(100% - 3rem) !important;
  width: 100% !important;
}

.recent-activities {
  height: 400px;
  overflow-y: auto;
}

.activity-item {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-time {
  color: #666;
  display: block;
  margin-bottom: 0.5rem;
}

.activity-text {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.upcoming-tasks {
  height: 400px;
  overflow-y: auto;
}

.task-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s;
}

.task-item:hover {
  background-color: #f8f9fa;
}

.task-item:last-child {
  border-bottom: none;
}

.task-info h4 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.task-info p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.task-details {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.due-date,
.comments-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  font-size: 0.9rem;
}

.custom-timeline :deep(.p-timeline-event-content) {
  line-height: 1.5;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stat-item {
    min-width: 100px;
    padding: 0.75rem;
  }

  .stat-value {
    font-size: 2rem;
  }
}
</style>

<style>
body {
  margin: 0;
  padding: 0;
}
</style>
