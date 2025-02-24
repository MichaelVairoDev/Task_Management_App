# 📋 Task Management App

## 📝 Descripción

Una aplicación moderna y completa de gestión de tareas construida con Vue.js, Express.js, PostgreSQL y Socket.IO. El proyecto incluye funcionalidades como gestión de tareas en tiempo real, sistema de notificaciones, seguimiento de actividades, y estadísticas del dashboard.

### ✨ Características Principales

- 📊 Dashboard en tiempo real con estadísticas
- ✅ Gestión de tareas con estados personalizables
- 🔔 Sistema de notificaciones en tiempo real
- 📈 Seguimiento de actividades
- 👥 Gestión de usuarios y roles
- 📱 Diseño responsive
- 🌙 Tema claro/oscuro
- 🔍 Búsqueda y filtros avanzados

## 📸 Capturas de Pantalla

### 📊 Dashboard

![Dashboard](/screenshots/dashboard.png)
_Panel principal con estadísticas y resumen de tareas_

### 📝 Gestión de Tareas

![Tareas](/screenshots/tasks.png)
_Interfaz de gestión de tareas con filtros y estados_

## 🚀 Tecnologías Utilizadas

### Frontend

- 🖼️ Vue.js 3 con TypeScript
- 🎨 PrimeVue para la interfaz de usuario
- 📊 Chart.js para gráficos
- 🔄 Pinia para el manejo del estado
- 🌐 Axios para las peticiones HTTP
- 🔌 Socket.IO-client para tiempo real

### Backend

- 📦 Node.js con Express
- 🗃️ PostgreSQL como base de datos
- 🔐 JWT para autenticación
- 📝 TypeScript para tipado estático
- 🔄 TypeORM para ORM
- 🔌 Socket.IO para comunicación en tiempo real

### DevOps

- 🐳 Docker y Docker Compose para containerización
- 🔄 Hot-reload en desarrollo
- 🔒 Variables de entorno para configuración
- 🌐 Nginx como servidor web

## 📁 Estructura del Proyecto

```
Task_Management_App/
├── frontend/                # Aplicación Vue.js
│   ├── src/
│   │   ├── assets/         # Recursos estáticos
│   │   ├── components/     # Componentes Vue
│   │   ├── views/          # Vistas principales
│   │   ├── stores/         # Estados Pinia
│   │   ├── router/         # Configuración de rutas
│   │   └── types/          # Definiciones TypeScript
│   ├── public/             # Archivos públicos
│   ├── Dockerfile          # Configuración Docker
│   └── nginx.conf          # Configuración Nginx
├── backend/                 # Servidor Express
│   ├── src/
│   │   ├── controllers/    # Controladores
│   │   ├── entities/       # Entidades TypeORM
│   │   ├── middleware/     # Middleware
│   │   ├── routes/         # Rutas API
│   │   └── types/          # Tipos TypeScript
│   ├── Dockerfile          # Configuración Docker
│   └── typeorm.config.ts   # Configuración TypeORM
└── docker-compose.yml      # Configuración Docker Compose
```

## 🛠️ Requisitos Previos

- Docker y Docker Compose instalados
- Node.js (versión 16 o superior)
- npm o yarn
- Git

## ⚙️ Configuración del Proyecto

1. **Clonar el repositorio**

```bash
git clone https://github.com/MichaelVairoDev/Task_Management_App.git
cd Task_Management_App
```

2. **Configurar variables de entorno**

Copia los archivos de ejemplo y configura tus variables:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

3. **Comandos Docker disponibles**

```bash
# Construir e iniciar todos los servicios
docker compose up --build

# Iniciar servicios en segundo plano
docker compose up -d

# Detener servicios
docker compose down

# Ver logs
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Reiniciar un servicio
docker compose restart backend

# Ejecutar migraciones
docker compose exec backend npm run typeorm migration:run
```

## 🚀 Acceso a la Aplicación

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Base de datos: localhost:5432

## 👤 Credenciales por Defecto

```
Email: admin@example.com
Password: [Configurado en el sistema]
```

## 🔌 API Endpoints Principales

### Autenticación

- POST /api/auth/login - Iniciar sesión
- POST /api/auth/register - Registrar usuario
- GET /api/auth/me - Obtener perfil

### Tareas

- GET /api/tasks - Listar tareas
- POST /api/tasks - Crear tarea
- PUT /api/tasks/:id - Actualizar tarea
- DELETE /api/tasks/:id - Eliminar tarea

### Actividades

- GET /api/activities - Listar actividades
- GET /api/activities/unread - Obtener no leídas

### Dashboard

- GET /api/dashboard - Obtener estadísticas
- GET /api/dashboard/stats - Obtener métricas

## 📚 Documentación Adicional

- [Guía de Desarrollo](docs/development.md)
- [API Documentation](docs/api.md)
- [Guía de Despliegue](docs/deployment.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un issue describiendo el problema y cómo reproducirlo.

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

⌨️ con ❤️ por [Michael Vairo]
