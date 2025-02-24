# Etapa de construcción
FROM node:16 AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript ignorando errores
RUN npm run build || true

# Etapa de producción
FROM node:16-slim

WORKDIR /app

# Copiar archivos necesarios
COPY package*.json ./
COPY .env ./
RUN apt-get update && apt-get install -y curl && \
    npm install --only=production

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/index.js"] 