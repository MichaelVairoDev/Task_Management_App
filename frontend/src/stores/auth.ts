import { defineStore } from "pinia";
import axios from "axios";
import router from "../router";

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: localStorage.getItem("token"),
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    setError(error: string | null) {
      this.error = error;
    },

    setLoading(loading: boolean) {
      this.loading = loading;
    },

    async login(email: string, password: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const response = await axios.post("/api/auth/login", {
          email,
          password,
        });

        const { token, user } = response.data;
        this.token = token;
        this.user = user;
        localStorage.setItem("token", token);

        return response;
      } catch (error: any) {
        let errorMessage = "Error al iniciar sesión";
        if (error.code === "ERR_NETWORK") {
          errorMessage = "Error de conexión con el servidor";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        this.setError(errorMessage);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async register(name: string, email: string, password: string) {
      this.setLoading(true);
      this.setError(null);

      try {
        const response = await axios.post("/api/auth/register", {
          name,
          email,
          password,
        });

        return response;
      } catch (error: any) {
        let errorMessage = "Error en el registro";
        if (error.code === "ERR_NETWORK") {
          errorMessage = "Error de conexión con el servidor";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        this.setError(errorMessage);
        throw error;
      } finally {
        this.setLoading(false);
      }
    },

    async logout() {
      this.token = null;
      this.user = null;
      this.error = null;
      localStorage.removeItem("token");
      router.push("/login");
    },

    async checkAuth() {
      if (!this.token) {
        return false;
      }

      try {
        const response = await axios.get("/api/auth/check");
        this.user = response.data.user;
        return true;
      } catch (error: any) {
        console.error("Error verificando autenticación:", error);
        this.logout();
        return false;
      }
    },
  },
});
