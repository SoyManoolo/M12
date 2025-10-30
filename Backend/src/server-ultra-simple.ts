// ULTRA SIMPLE - Solo Node.js HTTP nativo, SIN dependencias
import http from 'http';

const port = parseInt(process.env.PORT || "8080");

const server = http.createServer((req, res) => {
    console.log('[REQUEST]', req.method, req.url);
    
    res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    
    res.end(JSON.stringify({ 
        status: 'OK', 
        message: 'Ultra simple server running',
        path: req.url,
        timestamp: new Date().toISOString() 
    }));
});

server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Ultra simple server listening on 0.0.0.0:${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('PORT:', port);
});

server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
});
