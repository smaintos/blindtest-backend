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

/**
 * (Plus tard on ajoutera ici la route pour "join" et d’autres routes…)
 */

module.exports = router;
