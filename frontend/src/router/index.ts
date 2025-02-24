import { createRouter, createWebHistory } from "vue-router";
import { authGuard } from "./authGuard";
import Tasks from "../views/Tasks.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Dashboard from "../views/Dashboard.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: Dashboard,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/tasks",
      name: "Tasks",
      component: Tasks,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: {
        guestOnly: true,
      },
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
      meta: {
        guestOnly: true,
      },
    },
  ],
});

router.beforeEach(authGuard);

export default router;
