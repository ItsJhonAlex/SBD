// 🌸 Servidor principal del sistema SBD
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const agentsRoutes = require('./routes/agents');
const inventoryRoutes = require('./routes/inventory');
const locationsRoutes = require('./routes/locations');
const statisticsRoutes = require('./routes/statistics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.use('/api/agents', agentsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/statistics', statisticsRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SBD Inventory System running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
}); 