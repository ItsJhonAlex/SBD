const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get system statistics
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM get_system_statistics()');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching system statistics:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Equipment search
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const result = await pool.query(`
            SELECT * FROM v_equipment_search 
            WHERE LOWER(name) LIKE LOWER($1) 
            OR LOWER(description) LIKE LOWER($1)
            OR LOWER(identifier) LIKE LOWER($1)
            ORDER BY item_type, name
        `, [`%${term}%`]);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error searching equipment:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 