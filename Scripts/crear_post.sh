#!/bin/bash

# Variables
USER_ID="admin"
PASSWORD="admin"
IMAGE_PATH="/home/usuario/Descargas/imagen.jpg"
NUM_POSTS=21  # Puedes cambiar esto a cualquier número, 20, 50, etc.
API_URL="http://localhost:3000"

# Paso 1: Obtener el token autenticándose con las credenciales de admin
TOKEN=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
        "id": "'"$USER_ID"'",
        "password": "'"$PASSWORD"'"
      }' | jq -r '.token')

if [ "$TOKEN" == "null" ]; then
  echo "Error al obtener el token. Verifica tus credenciales."
  exit 1
fi

echo "Autenticación exitosa. Token: $TOKEN"

# Función para generar publicaciones
generate_post() {
  POST_ID=$1
  curl -X POST $API_URL/posts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: multipart/form-data" \
    -F "description=Post $POST_ID" \
    -F "media=@$IMAGE_PATH"
}

# Crear publicaciones
for ((i=1; i<=$NUM_POSTS; i++))
do
  echo "Creando publicación $i..."
  generate_post $i
done

echo "Se han creado $NUM_POSTS publicaciones."
