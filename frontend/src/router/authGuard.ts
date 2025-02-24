import { NavigationGuardNext, RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "../stores/auth";

export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore();

  // Si estamos verificando la autenticación, esperar
  if (authStore.isCheckingAuth) {
    return next(false);
  }

  const isAuthenticated = await authStore.checkAuth();

  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: "Login" });
  }

  // Si la ruta es solo para invitados (login/register) y el usuario está autenticado
  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: "Dashboard" });
  }

  // En cualquier otro caso, permitir la navegación
  return next();
};
