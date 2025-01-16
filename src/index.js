const express = require('express');
const cors = require('cors');
const playlistRoutes = require('./routes/playlist');
const gameRoutes = require('./routes/game');


const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());
app.use('/api', playlistRoutes);
app.use('/api', gameRoutes);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});