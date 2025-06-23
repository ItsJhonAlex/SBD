const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all locations
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM locations ORDER BY name');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get location statistics
router.get('/statistics', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_location_statistics ORDER BY location_name');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching location statistics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get location history
router.get('/history', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_location_history ORDER BY pc_name, start_time DESC');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching location history:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 