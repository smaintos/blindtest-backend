const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/playlist/:genre', async (req, res) => {
  const { genre } = req.params;
  
  const playlistIds = {
    rap: '3525945442',
    rnb: '2021626162',
    pop: '751764391',
    jazz: '1615514485'
  };

  try {
    const response = await axios.get(`https://api.deezer.com/playlist/${playlistIds[genre]}/tracks`);
    const tracks = response.data.data
      .filter(track => track.preview)
      .slice(0, 20)
      .map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist.name,
        preview: track.preview,
        cover: track.album.cover_medium
      }));

    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

module.exports = router;