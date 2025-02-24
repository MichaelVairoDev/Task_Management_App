<template>
  <div class="login-container">
    <div class="login-card animate-fade-in">
      <h2 class="text-center mb-4">Iniciar Sesión</h2>
      <Message v-if="authStore.error" severity="error">{{
        authStore.error
      }}</Message>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group animate-slide-up" style="--delay: 0.1s">
          <label for="email">Email</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            class="w-full"
            :class="{ 'p-invalid': submitted && !email }"
            :disabled="authStore.loading"
          />
          <small class="p-error" v-if="submitted && !email"
            >El email es requerido</small
          >
        </div>

        <div class="form-group animate-slide-up" style="--delay: 0.2s">
          <label for="password">Contraseña</label>
          <Password
            id="password"
            v-model="password"
            required
            :feedback="false"
            :toggleMask="true"
            class="w-full"
            :class="{ 'p-invalid': submitted && !password }"
            :inputStyle="{ width: '100%' }"
            inputClass="w-full"
            placeholder="Ingresa tu contraseña"
            :disabled="authStore.loading"
          />
          <small class="p-error" v-if="submitted && !password"
            >La contraseña es requerida</small
          >
        </div>

        <Button
          type="submit"
          label="Iniciar Sesión"
          :loading="authStore.loading"
          class="submit-button w-full animate-slide-up"
          style="--delay: 0.3s"
        />

        <div class="register-link animate-slide-up" style="--delay: 0.4s">
          ¿No tienes cuenta?
          <router-link to="/register" class="hover-effect"
            >Regístrate aquí</router-link
          >
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useToast } from "primevue/usetoast";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const email = ref("");
const password = ref("");
const submitted = ref(false);

const handleLogin = async () => {
  submitted.value = true;

  if (!email.value || !password.value) {
    return;
  }

  try {
    await authStore.login(email.value, password.value);

    toast.add({
      severity: "success",
      summary: "¡Bienvenido!",
      detail: "Has iniciado sesión correctamente",
      life: 3000,
    });

    router.push("/dashboard");
  } catch (error) {
    // El error ya se maneja en el store
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  transform-origin: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.submit-button {
  margin-top: 1rem;
  height: 3rem;
  font-size: 1.1rem;
}

.register-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.register-link a {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.5rem;
  transition: all 0.3s ease;
}

.hover-effect {
  position: relative;
}

.hover-effect::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -2px;
  left: 0;
  background-color: #2c3e50;
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease;
}

.hover-effect:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

/* Animaciones */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-slide-up {
  opacity: 0;
  animation: slideUp 0.6s ease-out forwards;
  animation-delay: var(--delay, 0s);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }

  .login-container {
    padding: 1rem;
  }
}
</style>
