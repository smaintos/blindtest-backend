const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// Import des routes
const playlistRoutes = require('./routes/playlist');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', playlistRoutes);

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration de Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Importation de la logique socket après avoir créé io
require('./routes/socketGame')(io);

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
