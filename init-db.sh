#!/bin/bash

# Crear el contenedor de PostgreSQL
docker run --name taskmanagement-db \
  -e POSTGRES_DB=taskmanagement \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  -d postgres:13 