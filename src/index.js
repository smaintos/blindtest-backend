const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const initializeSocketIO = require('./services/socketService');


// Import des routes
const playlistRoutes = require('./routes/playlist');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', playlistRoutes);

// Création du serveur HTTP
const server = http.createServer(app);

// Initialisation de Socket.IO
const io = initializeSocketIO(server);

// Middleware pour convertir les requêtes HTTP en événements Socket.IO
app.post('/socket.io/', (req, res) => {
  const { type, payload } = req.body;
  const socket = io.sockets.connected[req.headers['socket-id']];
  
  if (!socket) {
    return res.status(400).json({ error: 'Socket not connected' });
  }

  socket.emit(type, payload, (response) => {
    res.json(response);
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
