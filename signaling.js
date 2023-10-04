const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const connectedClients = new Set();
let waitingClients = [];

wss.on('connection', (ws) => {
    console.log('Client connected');

    // Add the new client to the set
    connectedClients.add(ws);
    waitingClients.push(ws);

    ws.on('message', (message) => {
        // Broadcast received messages to all connected clients (excluding the sender)
        connectedClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove the client from the set when they disconnect
        connectedClients.delete(ws);

        // Remove the client from the waiting list
        const index = waitingClients.indexOf(ws);
        if (index !== -1) {
            waitingClients.splice(index, 1);
        }
    });

    // Check if there are at least 2 waiting clients and create a random pair
    if (waitingClients.length >= 2) {
        const index1 = Math.floor(Math.random() * waitingClients.length);
        const client1 = waitingClients.splice(index1, 1)[0];

        const index2 = Math.floor(Math.random() * waitingClients.length);
        const client2 = waitingClients.splice(index2, 1)[0];

        // Notify both clients to establish a WebRTC connection
        client1.send(JSON.stringify({ type: 'connect' }));
        client2.send(JSON.stringify({ type: 'connect' }));
    }
});

console.log('Signaling server is running on port 8080');
