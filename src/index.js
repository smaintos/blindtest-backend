const express = require('express');
const cors = require('cors');
const playlistRoutes = require('./routes/playlist');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());
app.use('/api', playlistRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});