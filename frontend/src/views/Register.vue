<template>
  <div class="register-container">
    <div class="register-card animate-fade-in">
      <h2 class="text-center mb-4">Crear Cuenta</h2>
      <Message v-if="authStore.error" severity="error">{{
        authStore.error
      }}</Message>
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group animate-slide-up" style="--delay: 0.1s">
          <label for="name">Nombre</label>
          <InputText
            id="name"
            v-model="name"
            required
            placeholder="Tu nombre"
            class="w-full"
            :class="{ 'p-invalid': submitted && !name }"
            :disabled="authStore.loading"
          />
          <small class="p-error" v-if="submitted && !name"
            >El nombre es requerido</small
          >
        </div>

        <div class="form-group animate-slide-up" style="--delay: 0.2s">
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

        <div class="form-group animate-slide-up" style="--delay: 0.3s">
          <label for="password">Contraseña</label>
          <Password
            id="password"
            v-model="password"
            required
            :feedback="true"
            :toggleMask="true"
            class="w-full"
            :class="{ 'p-invalid': submitted && !password }"
            :inputStyle="{ width: '100%' }"
            inputClass="w-full"
            placeholder="Crea una contraseña segura"
            :disabled="authStore.loading"
          />
          <small class="p-error" v-if="submitted && !password"
            >La contraseña es requerida</small
          >
        </div>

        <Button
          type="submit"
          label="Registrarse"
          :loading="authStore.loading"
          class="submit-button w-full animate-slide-up"
          style="--delay: 0.4s"
        />

        <div class="login-link animate-slide-up" style="--delay: 0.5s">
          ¿Ya tienes cuenta?
          <router-link to="/login" class="hover-effect"
            >Inicia sesión aquí</router-link
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

const name = ref("");
const email = ref("");
const password = ref("");
const submitted = ref(false);

const handleRegister = async () => {
  submitted.value = true;

  if (!name.value || !email.value || !password.value) {
    return;
  }

  try {
    const response = await authStore.register(
      name.value,
      email.value,
      password.value
    );

    if (response.status === 201) {
      toast.add({
        severity: "success",
        summary: "¡Registro exitoso!",
        detail:
          "Tu cuenta ha sido creada correctamente. Por favor, inicia sesión.",
        life: 5000,
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }
  } catch (error) {
    // El error ya se maneja en el store
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.register-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  transform-origin: center;
}

.register-form {
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

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.login-link a {
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
  .register-card {
    padding: 1.5rem;
  }

  .register-container {
    padding: 1rem;
  }
}
</style>
