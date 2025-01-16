const { Server } = require('socket.io');

function initializeSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  require('../routes/socketGame')(io);
  
  return io;
}

module.exports = initializeSocketIO;