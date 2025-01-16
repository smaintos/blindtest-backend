module.exports = (io) => {
  const games = {};

  function generateGameCode(length = 5) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);

    socket.on('createGame', (payload, callback) => {
      const { playerName } = payload;
      const code = generateGameCode();
      
      games[code] = {
        code,
        players: [{ id: socket.id, name: playerName }],
        isOpen: true,
        host: socket.id
      };

      socket.join(code);
      callback({ success: true, game: games[code] });
    });

    socket.on('joinGame', (payload, callback) => {
      const { code, playerName } = payload;
      const game = games[code];

      if (!game) {
        callback({ success: false, error: 'Partie introuvable' });
        return;
      }

      if (!game.isOpen) {
        callback({ success: false, error: 'Partie fermée' });
        return;
      }

      game.players.push({ id: socket.id, name: playerName });
      socket.join(code);

      io.to(code).emit('playerJoined', { game });
      callback({ success: true, game });
    });

    socket.on('closeGame', (payload, callback) => {
      const { code } = payload;
      const game = games[code];

      if (!game) {
        callback({ success: false, error: 'Partie introuvable' });
        return;
      }

      if (game.host !== socket.id) {
        callback({ success: false, error: 'Seul l\'hôte peut fermer la partie' });
        return;
      }

      game.isOpen = false;
      io.to(code).emit('gameClosed');
      delete games[code];
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
      
      // Mettre à jour les listes de joueurs dans les parties
      Object.values(games).forEach(game => {
        const index = game.players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          game.players.splice(index, 1);
          io.to(game.code).emit('playerJoined', { game });
        }
      });
    });
  });
};