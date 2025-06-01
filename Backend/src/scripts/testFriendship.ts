/*

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

        // 3. Verificar estado inicial de la relación
        console.log('\n3. Verificando estado inicial de la relación...');
        const initialStatus = await axios.get(
            `${API_URL}/friendship/status/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Estado inicial:', initialStatus.data);

        // 4. Enviar solicitud de amistad
        console.log('\n4. Enviando solicitud de amistad...');
        const requestResponse = await axios.post(
            `${API_URL}/friendship/request`,
            { receiver_id: user2_id, created_from: 'search' },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Solicitud enviada:', requestResponse.data);

        // 5. Verificar solicitudes enviadas
        console.log('\n5. Verificando solicitudes enviadas...');
        const sentRequests = await axios.get(
            `${API_URL}/friendship/requests/sent`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Solicitudes enviadas:', sentRequests.data);

        // 6. Verificar solicitudes pendientes
        console.log('\n6. Verificando solicitudes pendientes...');
        const pendingRequests = await axios.get(
            `${API_URL}/friendship/requests/pending`,
            { headers: { Authorization: `Bearer ${token2}` } }
        );
        console.log('✅ Solicitudes pendientes:', pendingRequests.data);

        // 7. Verificar estado de la relación después de enviar solicitud
        console.log('\n7. Verificando estado de la relación después de enviar solicitud...');
        const statusAfterRequest = await axios.get(
            `${API_URL}/friendship/status/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Estado después de enviar solicitud:', statusAfterRequest.data);

        // 8. Cancelar solicitud
        console.log('\n8. Cancelando solicitud de amistad...');
        const cancelResponse = await axios.post(
            `${API_URL}/friendship/request/${requestResponse.data.request_id}/cancel`,
            {},
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Solicitud cancelada:', cancelResponse.data);

        // 9. Verificar estado después de cancelar
        console.log('\n9. Verificando estado después de cancelar...');
        const statusAfterCancel = await axios.get(
            `${API_URL}/friendship/status/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Estado después de cancelar:', statusAfterCancel.data);

        // 10. Enviar nueva solicitud
        console.log('\n10. Enviando nueva solicitud de amistad...');
        const newRequestResponse = await axios.post(
            `${API_URL}/friendship/request`,
            { receiver_id: user2_id, created_from: 'search' },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Nueva solicitud enviada:', newRequestResponse.data);

        // 11. Rechazar solicitud
        console.log('\n11. Rechazando solicitud de amistad...');
        const rejectResponse = await axios.post(
            `${API_URL}/friendship/request/${newRequestResponse.data.request_id}/reject`,
            {},
            { headers: { Authorization: `Bearer ${token2}` } }
        );
        console.log('✅ Solicitud rechazada:', rejectResponse.data);

        // 12. Verificar estado después de rechazar
        console.log('\n12. Verificando estado después de rechazar...');
        const statusAfterReject = await axios.get(
            `${API_URL}/friendship/status/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Estado después de rechazar:', statusAfterReject.data);

        // 13. Enviar última solicitud
        console.log('\n13. Enviando última solicitud de amistad...');
        const finalRequestResponse = await axios.post(
            `${API_URL}/friendship/request`,
            { receiver_id: user2_id, created_from: 'search' },
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Última solicitud enviada:', finalRequestResponse.data);

        // 14. Aceptar solicitud
        console.log('\n14. Aceptando solicitud de amistad...');
        const acceptResponse = await axios.post(
            `${API_URL}/friendship/request/${finalRequestResponse.data.request_id}/accept`,
            {},
            { headers: { Authorization: `Bearer ${token2}` } }
        );
        console.log('✅ Solicitud aceptada:', acceptResponse.data);

        // 15. Verificar lista de amigos
        console.log('\n15. Verificando lista de amigos...');
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

        // 16. Verificar estado final
        console.log('\n16. Verificando estado final de la relación...');
        const finalStatus = await axios.get(
            `${API_URL}/friendship/status/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Estado final:', finalStatus.data);

        // 17. Eliminar amistad
        console.log('\n17. Eliminando amistad...');
        await axios.delete(
            `${API_URL}/friendship/friends/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Amistad eliminada');

        // 18. Verificar estado final después de eliminar
        console.log('\n18. Verificando estado final después de eliminar...');
        const finalStatusAfterDelete = await axios.get(
            `${API_URL}/friendship/status/${user2_id}`,
            { headers: { Authorization: `Bearer ${token1}` } }
        );
        console.log('✅ Estado final después de eliminar:', finalStatusAfterDelete.data);

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
    */