const express = require('express');
const router = express.Router();

// Stockage en mémoire (pour la démonstration)
// Dans un vrai projet, on utiliserait une DB (MySQL, MongoDB, Firebase, etc.)
const games = {};

// Petite fonction utilitaire pour générer un code unique à 5 chiffres
function generateGameCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

/**
 * Route POST /games/create
 * Permet de créer une nouvelle partie, retourne un code unique de 5 chiffres
 */
router.post('/games/create', (req, res) => {
  const { gameName } = req.body;

  // Génération du code unique
  const code = generateGameCode();

  // On crée un nouvel objet "game" (en mémoire) avec ce code
  games[code] = {
    code,
    name: gameName || "Partie sans nom",
    players: [],
    isOpen: true,
  };

  console.log('Nouvelle partie créée :', games[code]);

  // On renvoie simplement le code au client
  return res.json({ code });
});

// Router pour rejoindre une partie
router.post('/games/join', (req, res) => {
    const { code, playerName } = req.body;
  
    // 1. Vérifier si la partie existe
    const game = games[code];
    if (!game) {
      return res.status(404).json({ error: "Partie introuvable." });
    }
  
    // 2. Vérifier si la partie est encore ouverte
    if (!game.isOpen) {
      return res.status(400).json({ error: "La partie est déjà fermée." });
    }
  
    // 3. Ajouter le joueur
    if (!game.players.includes(playerName)) {
      game.players.push(playerName);
    }
  
    // Optionnel : Log
    console.log(`Joueur "${playerName}" a rejoint la partie ${code}`);
  
    // 4. Retourner la partie ou un message de succès
    return res.json({
      success: true,
      game: {
        code: game.code,
        name: game.name,
        players: game.players,
        isOpen: game.isOpen,
      },
    });
  });

  // Récupérer la partie selon son code
router.get('/games/:code', (req, res) => {
  const { code } = req.params;
  const game = games[code];

  if (!game) {
    return res.status(404).json({ error: "Partie introuvable." });
  }

  return res.json(game); // renvoie un objet JSON ex: { code, name, players, isOpen }
});

module.exports = router;
