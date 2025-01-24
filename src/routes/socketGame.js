module.exports = (io) => {
  const games = {};
  const userSockets = new Map();

  function generateGameCode(length = 5) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  io.on('connection', (socket) => {
    let currentUid = null;

    socket.on('authenticate', ({ uid }) => {
      currentUid = uid;
      userSockets.set(uid, socket.id);
    });

    socket.on('createGame', (payload, callback) => {
      const { playerName, uid } = payload;
      const code = generateGameCode();
      
      games[code] = {
        code,
        players: [{ id: uid, name: playerName, score: 0 }],
        isOpen: true,
        host: uid,
        genre: null,
        isPlaying: false,
        currentTrackIndex: 0,
        canGuess: true
      };

      socket.join(code);
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
        game.players.push({ id: uid, name: playerName, score: 0 });
      }

      socket.join(code);
      io.to(code).emit('playerJoined', { game });
      callback({ success: true, game });
    });

    socket.on('selectGenre', (payload, callback) => {
      const { code, genre } = payload;
      const game = games[code];

      if (!game || game.host !== currentUid) {
        callback({ success: false, error: 'Non autorisé' });
        return;
      }

      game.genre = genre;
      game.isPlaying = true;
      game.currentTrackIndex = 0;
      game.canGuess = true;

      io.to(code).emit('gameUpdated', { game });
      callback({ success: true });
    });

    socket.on('correctGuess', (payload) => {
      const { code, playerId } = payload;
      const game = games[code];
    
      if (!game || !game.canGuess) return;
    
      const player = game.players.find(p => p.id === playerId);
      if (player) {
        game.canGuess = false;
        player.score += 1;
        
        // Envoyer la notification à tous les joueurs
        io.to(code).emit('correctAnswerFound', { 
          game,
          winnerName: player.name
        });
    
        // Attendre 2 secondes puis mettre à jour l'index pour tous
        setTimeout(() => {
          game.currentTrackIndex += 1;
          game.canGuess = true;
          
          // Envoyer la mise à jour à tous les joueurs, y compris l'hôte
          io.to(code).emit('nextTrack', { 
            game,
            currentTrackIndex: game.currentTrackIndex
          });
        }, 2000);
      }
    });

    socket.on('timerEnded', (payload) => {
      const { code, currentTrackIndex } = payload;
      const game = games[code];
    
      if (!game || game.host !== currentUid) return;
    
      game.currentTrackIndex = currentTrackIndex;
      game.canGuess = true;
      
      // Émettre l'événement à tous les joueurs
      io.to(code).emit('nextTrack', { 
        game,
        currentTrackIndex: game.currentTrackIndex
      });
    });

    socket.on('closeGame', (payload, callback) => {
      const { code } = payload;
      const game = games[code];

      if (!game || game.host !== currentUid) {
        callback({ success: false, error: 'Non autorisé' });
        return;
      }

      delete games[code];
      io.to(code).emit('gameClosed');
      callback({ success: true });
    });

    socket.on('disconnect', () => {
      if (currentUid) {
        userSockets.delete(currentUid);
      }
    });
  });
};