module.exports = (io) => {
  const games = {};
  const userSockets = new Map(); // Stocke la relation uid -> socket.id

  function generateGameCode(length = 5) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);
    let currentUid = null;

    socket.on('authenticate', ({ uid }) => {
      currentUid = uid;
      if (userSockets.has(uid)) {
        const oldSocketId = userSockets.get(uid);
        io.sockets.sockets.get(oldSocketId)?.disconnect();
      }
      userSockets.set(uid, socket.id);
      console.log(`Utilisateur ${uid} authentifié avec socket ${socket.id}`);
    });

    socket.on('createGame', (payload, callback) => {
      const { playerName, uid } = payload;
      const code = generateGameCode();
      
      games[code] = {
        code,
        players: [{ id: uid, name: playerName }],
        isOpen: true,
        host: uid,
        genre: null,
        isPlaying: false,
        currentTrackIndex: 0
      };

      socket.join(code);
      console.log(`Partie créée avec le code ${code} par ${playerName}`);
      callback({ success: true, game: games[code] });
    });

    socket.on('joinGame', (payload, callback) => {
      const { code, playerName, uid } = payload;
      const game = games[code];

      if (!game) {
        callback({ success: false, error: 'Partie introuvable' });
        return;
      }

      if (!game.isOpen) {
        callback({ success: false, error: 'Partie fermée' });
        return;
      }

      const existingPlayer = game.players.find(player => player.id === uid);
      if (!existingPlayer) {
        game.players.push({ id: uid, name: playerName });
      }

      socket.join(code);
      console.log(`Joueur "${playerName}" a rejoint la partie ${code}`);
      io.to(code).emit('playerJoined', { game });
      callback({ success: true, game });
    });

    socket.on('selectGenre', (payload, callback) => {
      const { code, genre } = payload;
      const game = games[code];

      if (!game) {
        callback({ success: false, error: 'Partie introuvable' });
        return;
      }

      if (game.host !== currentUid) {
        callback({ success: false, error: 'Seul l\'hôte peut sélectionner le genre' });
        return;
      }

      game.genre = genre;
      game.isPlaying = true;
      console.log(`Genre ${genre} sélectionné pour la partie ${code}`);
      
      io.to(code).emit('gameUpdated', { game });
      callback({ success: true });
    });

    socket.on('updateTrackIndex', (payload, callback) => {
      const { code, index } = payload;
      const game = games[code];

      if (!game) {
        callback({ success: false, error: 'Partie introuvable' });
        return;
      }

      if (game.host !== currentUid) {
        callback({ success: false, error: 'Seul l\'hôte peut changer de piste' });
        return;
      }

      game.currentTrackIndex = index;
      io.to(code).emit('trackUpdated', { currentTrackIndex: index });
      callback({ success: true });
    });

    socket.on('closeGame', (payload, callback) => {
      const { code } = payload;
      const game = games[code];

      if (!game) {
        callback({ success: false, error: 'Partie introuvable' });
        return;
      }

      if (game.host !== currentUid) {
        callback({ success: false, error: 'Seul l\'hôte peut fermer la partie' });
        return;
      }

      game.isOpen = false;
      console.log(`Partie ${code} fermée par l'hôte`);
      io.to(code).emit('gameClosed');
      delete games[code];
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
      if (currentUid) {
        userSockets.delete(currentUid);
      }
      
      Object.values(games).forEach(game => {
        const index = game.players.findIndex(p => p.id === currentUid);
        if (index !== -1) {
          game.players.splice(index, 1);
          io.to(game.code).emit('playerJoined', { game });
        }
      });
    });
  });
};