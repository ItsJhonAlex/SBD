const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get all agents with location info
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_agents_with_location ORDER BY pc_name');
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search agents
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const result = await pool.query('SELECT * FROM search_agents($1)', [term]);
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error searching agents:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get agent complete information
router.get('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM get_agent_complete_info($1)', [id]);
        res.json({
            success: true,
            data: result.rows[0] || null
        });
    } catch (error) {
        console.error('Error fetching agent details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get agent RAM information
router.get('/:id/ram', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM get_agent_ram_info($1)', [id]);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching RAM info:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Move agent to location
router.post('/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { location_id } = req.body;
        
        const result = await pool.query('SELECT move_agent_to_location($1, $2)', [id, location_id]);
        
        if (result.rows[0].move_agent_to_location) {
            res.json({
                success: true,
                message: 'Agent moved successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Failed to move agent'
            });
        }
    } catch (error) {
        console.error('Error moving agent:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 