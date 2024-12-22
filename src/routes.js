const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/search', async (req, res) => {
  const { artist } = req.query;
  try {
    const response = await axios.get(`https://api.deezer.com/search?q=${artist}`);
    const data = response.data.data.map(track => ({
      title: track.title,
      artist: track.artist.name,
      albumCover: track.album.cover,
      preview: track.preview
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data from Deezer API' });
  }
});

module.exports = router;