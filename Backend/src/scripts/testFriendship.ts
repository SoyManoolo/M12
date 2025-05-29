#!/usr/bin/env node

import axios from 'axios';
// Importación compatible con CommonJS y ESModule
const jwt_decode = require('jwt-decode').default;

const API_URL = 'http://localhost:3000';

// Datos de prueba para los usuarios
const TEST_USERS = {
    user1: {
        username: 'test_user1',
        email: 'test1@test.com',
        password: 'Test123!',
        name: 'Test User 1',
        surname: 'Test Surname 1'
    },
    user2: {
        username: 'test_user2',
        email: 'test2@test.com',
        password: 'Test123!',
        name: 'Test User 2',
        surname: 'Test Surname 2'
    }
};

function getUserIdFromToken(token: string): string {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    return decoded.user_id;
}

async function registerUser(userData: typeof TEST_USERS.user1) {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        console.log('Respuesta de registro:', response.data);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 409) {
            // Si el usuario ya existe, intentamos hacer login
            const loginResponse = await loginUser(userData.email, userData.password);
            console.log('Respuesta de login:', loginResponse);
            return loginResponse;
        }
        throw error;
    }
}

async function loginUser(email: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/login`, {
        id: email,
        password
    });
    console.log('Respuesta de login:', response.data);
    return response.data;
}

async function testFriendship() {
    try {
        console.log('🚀 Iniciando pruebas de amistad...\n');

        // 1. Registrar/Login usuario 1
        console.log('1. Registrando/Login usuario 1...');
        const user1Data = await registerUser(TEST_USERS.user1);
        const token1 = user1Data.token;
        const user1_id = getUserIdFromToken(token1);
        console.log('✅ Usuario 1 autenticado');

        // 2. Registrar/Login usuario 2
        console.log('\n2. Registrando/Login usuario 2...');
        const user2Data = await registerUser(TEST_USERS.user2);
        const token2 = user2Data.token;
        const user2_id = getUserIdFromToken(token2);
        console.log('✅ Usuario 2 autenticado');

        // 3. Enviar solicitud de amistad
        console.log('\n3. Enviando solicitud de amistad...');
        const requestResponse = await axios.post(
            `${API_URL}/friendship/request`,
            { receiver_id: user2_id, created_from: 'search' },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Solicitud enviada:', requestResponse.data);

        // 4. Obtener solicitudes pendientes
        console.log('\n4. Obteniendo solicitudes pendientes...');
        const pendingRequests = await axios.get(
            `${API_URL}/friendship/requests/pending`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );
        console.log('✅ Solicitudes pendientes:', pendingRequests.data);

        // 5. Aceptar solicitud
        console.log('\n5. Aceptando solicitud de amistad...');
        const acceptResponse = await axios.post(
            `${API_URL}/friendship/request/${requestResponse.data.request_id}/accept`,
            {},
            { headers: { Authorization: `Bearer ${token2}` } }
        );
        console.log('✅ Solicitud aceptada:', acceptResponse.data);

        // 6. Obtener lista de amigos
        console.log('\n6. Obteniendo lista de amigos...');
        const friendsList1 = await axios.get(
            `${API_URL}/friendship/friends`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        const friendsList2 = await axios.get(
            `${API_URL}/friendship/friends`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );
        console.log('✅ Lista de amigos usuario 1:', friendsList1.data);
        console.log('✅ Lista de amigos usuario 2:', friendsList2.data);

        // 7. Eliminar amistad
        console.log('\n7. Eliminando amistad...');
        await axios.delete(
            `${API_URL}/friendship/friends/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Amistad eliminada');

        // 8. Verificar que ya no son amigos
        console.log('\n8. Verificando que ya no son amigos...');
        const finalFriendsList = await axios.get(
            `${API_URL}/friendship/friends`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Lista final de amigos:', finalFriendsList.data);

        console.log('\n✨ ¡Todas las pruebas completadas con éxito!');
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error('\n❌ Error durante las pruebas:', error.response?.data || error.message);
        } else {
            console.error('\n❌ Error durante las pruebas:', error.message);
        }
        throw error;
    }
}

// Ejecutar las pruebas
testFriendship()
    .then(() => process.exit(0))
    .catch(() => process.exit(1)); 