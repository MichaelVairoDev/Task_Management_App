import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import axios from "axios";

// PrimeVue
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Toast from "primevue/toast";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Password from "primevue/password";
import Message from "primevue/message";

// Estilos de PrimeVue
import "primevue/resources/themes/lara-light-blue/theme.css";
import "primevue/resources/primevue.min.css";
import "primeicons/primeicons.css";

// Configurar axios
axios.defaults.baseURL = "http://localhost:3001";
axios.defaults.headers.common["Content-Type"] = "application/json";
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.withCredentials = true;

// Interceptor para manejar errores
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Error de conexión con el servidor");
    }
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      router.push("/login");
    }
    return Promise.reject(error);
  }
);

const app = createApp(App);
const pinia = createPinia();

// Configurar PrimeVue
app.use(PrimeVue, {
  ripple: true,
  inputStyle: "filled",
});
app.use(ToastService);

// Registrar componentes globalmente
app.component("Toast", Toast);
app.component("InputText", InputText);
app.component("Button", Button);
app.component("Password", Password);
app.component("Message", Message);

app.use(pinia);
app.use(router);

app.mount("#app");
