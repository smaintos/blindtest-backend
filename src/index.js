const express = require('express');
const http = require('http');
const cors = require('cors');

// Import (ou pas) pour d’autres routes REST existantes
const playlistRoutes = require('./routes/playlist');
require('./routes/socketGame');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', playlistRoutes);

// On crée un serveur HTTP brut
const server = http.createServer(app);

// On plug Socket.io sur ce serveur
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// On exporte io ou on gère la logique Socket.io ici
module.exports = { io };
