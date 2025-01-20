const express = require('express');
const http = require('http');
const cors = require('cors');
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
initializeSocketIO(server);

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});