// TEST SIMPLE - Solo HTTP sin Socket.IO ni nada más
import express from 'express';

const app = express();
const port = parseInt(process.env.PORT || "8080");

app.get('/health', (req, res) => {
    console.log('[HEALTH] Health check recibido');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
    console.log('[REQUEST]', req.method, req.path);
    res.json({ message: 'Server running', path: req.path });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Servidor simple escuchando en 0.0.0.0:${port}`);
});
