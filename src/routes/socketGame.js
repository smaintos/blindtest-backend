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
      if (typeof callback === "function") {
        callback({ success: true, game: games[code] });
      } else {
        console.error("Callback is not a function");
      }
    });

    socket.on('joinGame', (payload, callback) => {
      const { code, playerName, uid } = payload;
      const game = games[code];

      if (!game) {
        if (typeof callback === "function") {
          callback({ success: false, error: 'Partie introuvable' });
        } else {
          console.error("Callback is not a function");
        }
        return;
      }

      if (!game.isOpen) {
        if (typeof callback === "function") {
          callback({ success: false, error: 'Partie fermée' });
        } else {
          console.error("Callback is not a function");
        }
        return;
      }

      const existingPlayer = game.players.find(player => player.id === uid);
      if (!existingPlayer) {
        game.players.push({ id: uid, name: playerName, score: 0 });
      }

      socket.join(code);
      io.to(code).emit('playerJoined', { game });
      if (typeof callback === "function") {
        callback({ success: true, game });
      } else {
        console.error("Callback is not a function");
      }
    });

    socket.on('selectGenre', (payload, callback) => {
      const { code, genre } = payload;
      const game = games[code];

      if (!game || game.host !== currentUid) {
        if (typeof callback === "function") {
          callback({ success: false, error: 'Non autorisé' });
        } else {
          console.error("Callback is not a function");
        }
        return;
      }

      game.genre = genre;
      game.isPlaying = true;
      game.currentTrackIndex = 0;
      game.canGuess = true;
      io.to(code).emit('gameUpdated', { game });
      if (typeof callback === "function") {
        callback({ success: true });
      } else {
        console.error("Callback is not a function");
      }
    });

    socket.on('correctGuess', ({ code, playerId, isLastTrack }) => {
      const game = games[code];
      
      if (!game) return;
    
      // Trouver le joueur qui a fait la bonne réponse
      const winner = game.players.find(p => p.id === playerId);
      if (!winner) return;
    
      // Mettre à jour le score
      game.players = game.players.map(player => {
        if (player.id === playerId) {
          return { ...player, score: player.score + 1 };
        }
        return player;
      });
    
      io.to(code).emit('correctAnswerFound', { 
        game,
        winnerName: winner.name, // Utiliser le nom du gagnant trouvé
        trackTitle: game.tracks[game.currentTrackIndex].title 
      });
    
      setTimeout(() => {
        game.currentTrackIndex++;
        game.canGuess = true;
    
        if (isLastTrack) {
          io.to(code).emit('gameEnded', { game });
        } else {
          io.to(code).emit('nextTrack', { 
            game,
            currentTrackIndex: game.currentTrackIndex
          });
        }
      }, 2000);
    });

    socket.on('timerEnded', ({ code, currentTrackIndex, timeUp }) => {
      const game = games[code];
      
      if (!game) return;
    
      if (timeUp && currentTrackIndex >= game.tracks.length - 1) {
        io.to(code).emit('gameEnded', { game });
      } else {
        game.currentTrackIndex = currentTrackIndex;
        game.canGuess = true;
        io.to(code).emit('nextTrack', { 
          game,
          currentTrackIndex 
        });
      }
    });

    socket.on('closeGame', (payload, callback = () => {}) => {
      const { code } = payload;
      const game = games[code];
    
      if (!game || game.host !== currentUid) {
        io.to(socket.id).emit('error', { message: 'Non autorisé' });
        if (typeof callback === "function") {
          callback({ success: false, error: 'Non autorisé' });
        }
        return;
      }
    
      delete games[code];
      io.to(code).emit('gameClosed');
      if (typeof callback === "function") {
        callback({ success: true });
      }
    });

    socket.on('gameOver', ({ code }) => {
      const game = games[code];
      if (game) {
        io.to(code).emit('gameOver', { game });
      }
    });

    socket.on('disconnect', () => {
      if (currentUid) {
        userSockets.delete(currentUid);
      }
    });
  });
};