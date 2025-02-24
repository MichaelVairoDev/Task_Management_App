<template>
  <Toast position="top-right" />
  <div class="app-container">
    <nav class="navbar" v-if="isAuthenticated">
      <div class="nav-brand">Task Management</div>
      <div class="nav-items">
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link to="/tasks">Tareas</router-link>
        <a href="#" @click.prevent="logout">Cerrar Sesión</a>
      </div>
    </nav>

    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useAuthStore } from "./stores/auth";

export default defineComponent({
  name: "App",
  setup() {
    const authStore = useAuthStore();

    const logout = async () => {
      await authStore.logout();
    };

    return {
      isAuthenticated: computed(() => authStore.isAuthenticated),
      logout,
    };
  },
});
</script>

<style>
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.navbar {
  background-color: #2c3e50;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-items {
  display: flex;
  gap: 1.5rem;
}

.nav-items a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-items a:hover {
  background-color: #34495e;
}

#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}
</style>
