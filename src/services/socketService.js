const { Server } = require('socket.io');

function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true
    }
  });

  require('../routes/socketGame')(io);
  
  return io;
}

module.exports = initializeSocketIO;