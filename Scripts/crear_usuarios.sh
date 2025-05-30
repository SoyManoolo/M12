#!/bin/bash

# Variables
NUM_USERS=10  # Número de usuarios a crear
API_URL="http://localhost:3000"

# Función para generar usuarios
generate_user() {
  USER_NUM=$1
  curl -X POST $API_URL/auth/register \
    -H "Content-Type: application/json" \
    -d '{
          "email": "admin'$USER_NUM'@example.com",
          "username": "admin'$USER_NUM'",
          "name": "Administrador",
          "surname": "'$USER_NUM'",
          "password": "admin'$USER_NUM'123"
        }'
}

# Crear usuarios
for ((i=1; i<=$NUM_USERS; i++))
do
  echo "Creando usuario $i..."
  generate_user $i
  sleep 1  # Pequeña pausa entre cada creación para no sobrecargar el servidor
done

echo "Se han creado $NUM_USERS usuarios."
echo "Credenciales de los usuarios creados:"
for ((i=1; i<=$NUM_USERS; i++))
do
  echo "Usuario $i:"
  echo "  Email: admin$i@example.com"
  echo "  Username: admin$i"
  echo "  Password: admin$i123"
  echo "------------------------"
done 