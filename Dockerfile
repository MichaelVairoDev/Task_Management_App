# Servicio de Frontend (Vue)
FROM node:16 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Servicio de Backend (Express + Socket.io)
FROM node:16 AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend .

# Servicio de Base de Datos (PostgreSQL)
FROM postgres:13
ENV POSTGRES_DB=taskmanagement
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password123 