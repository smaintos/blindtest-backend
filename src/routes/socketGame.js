// socketGame.js
const { io } = require('../index);

// On stocke les parties en mémoire (exemple)
const games = {}; 
/**
 * Structure:
 * games = {
 *   "12345": {
 *     code: "12345",
 *     name: "Partie rap",
 *     players: ["Alice", "Bob"],
 *     isOpen: true
 *   },
 * }
 */

function generateGameCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

// Quand un client se connecte au websocket
io.on('connection', (socket) => {
  console.log('Un client est connecté :', socket.id);

  // Événement : Créer une partie
  socket.on('createGame', (payload, callback) => {
    const { gameName, playerName } = payload;

    const code = generateGameCode();
    games[code] = {
      code,
      name: gameName || 'Partie sans nom',
      players: [],
      isOpen: true,
    };

    // Pour que ce socket rejoigne la "room" correspondant à la partie
    socket.join(code);

    // Ajout du joueur créateur dans la liste
    games[code].players.push(playerName);

    console.log(`Partie créée : ${code}, par ${playerName}`);

    // On peut renvoyer une confirmation via un callback
    if (callback) {
      callback({
        success: true,
        code,
        game: games[code],
      });
    }

    // Éventuellement, on peut aussi émettre un événement “gameCreated” juste pour ce socket
    socket.emit('gameCreated', { code, game: games[code] });
  });

  // Événement : Rejoindre une partie
  socket.on('joinGame', (payload, callback) => {
    const { code, playerName } = payload;
    const game = games[code];

    if (!game) {
      if (callback) {
        callback({ success: false, error: 'Partie introuvable.' });
      }
      return;
    }

    if (!game.isOpen) {
      if (callback) {
        callback({ success: false, error: 'La partie est fermée.' });
      }
      return;
    }

    // Ajouter le joueur
    if (!game.players.includes(playerName)) {
      game.players.push(playerName);
    }

    // Joindre la "room" Socket.io => pour recevoir les updates
    socket.join(code);

    console.log(`Joueur "${playerName}" a rejoint la partie ${code}`);

    // Notifier tous les sockets dans cette room qu’un nouveau joueur vient d’arriver
    io.to(code).emit('playerJoined', {
      code,
      players: game.players,
    });

    // Optionnel, renvoyer un callback au socket qui a demandé à rejoindre
    if (callback) {
      callback({ success: true, game });
    }
  });

  // Événement : Fermer une partie
  socket.on('closeGame', (payload, callback) => {
    const { code } = payload;
    const game = games[code];

    if (!game) {
      if (callback) {
        callback({ success: false, error: 'Partie introuvable.' });
      }
      return;
    }

    game.isOpen = false;
    console.log(`Partie ${code} fermée.`);

    // On notifie tous les sockets de la room
    io.to(code).emit('gameClosed', { code });

    if (callback) {
      callback({ success: true });
    }
  });

  // Quand un client se déconnecte
  socket.on('disconnect', () => {
    console.log(`Socket déconnecté : ${socket.id}`);
    // Ici, on pourrait mettre à jour les listes de joueurs, etc. 
  });
});

