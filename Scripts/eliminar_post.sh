#!/bin/bash

# Configuración
API_URL="http://localhost:3000"
USER_ID="admin"
PASSWORD="admin"

# Paso 1: Autenticarse y obtener el token
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

# Paso 2: Obtener todas las publicaciones
echo "Obteniendo todas las publicaciones..."
POSTS=$(curl -X GET "$API_URL/posts?limit=999" -H "Authorization: Bearer $TOKEN")

# Paso 3: Extraer los post_id y eliminar cada publicación
POST_IDS=$(echo $POSTS | jq -r '.data.posts[].post_id')

if [ -z "$POST_IDS" ]; then
  echo "No se encontraron publicaciones para eliminar."
  exit 1
fi

# Eliminar cada publicación
for POST_ID in $POST_IDS; do
  echo "Eliminando publicación con post_id: $POST_ID..."
  DELETE_RESPONSE=$(curl -X DELETE "$API_URL/posts/$POST_ID" -H "Authorization: Bearer $TOKEN")
  DELETE_STATUS=$(echo $DELETE_RESPONSE | jq -r '.status')
  
  if [ "$DELETE_STATUS" == "200" ]; then
    echo "Publicación con post_id $POST_ID eliminada exitosamente."
  else
    echo "Error al eliminar la publicación con post_id $POST_ID."
  fi
done

echo "Proceso de eliminación de publicaciones completado."
