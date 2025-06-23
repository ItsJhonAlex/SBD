const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// Get inventory summary by agent
router.get('/summary', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_inventory_summary_by_agent ORDER BY pc_name');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching inventory summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get complete hardware information
router.get('/hardware', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_hardware_complete ORDER BY agent_name, inventory_date DESC');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching hardware inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get software by agent
router.get('/software', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_software_by_agent ORDER BY pc_name, software_type');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching software inventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get motherboard configurations
router.get('/motherboards', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_motherboard_configuration ORDER BY agent_name');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching motherboard configurations:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// RAM Analysis
router.get('/ram-analysis', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_ram_analysis ORDER BY agent_name');
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching RAM analysis:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router; 