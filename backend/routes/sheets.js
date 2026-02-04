const express = require('express');
const router = express.Router();
const sheetsClient = require('../utils/googleSheetsClient');

// Get Spreadsheet metadata and/or values
// GET /api/sheets/:id?range=Sheet1!A1:Z100
router.get('/sheets/:id', async (req, res) => {
    const { id } = req.params;
    const { range } = req.query;

    try {
        if (range) {
            const values = await sheetsClient.getValues(id, range);
            return res.json({ values });
        } else {
            const metadata = await sheetsClient.getSpreadsheet(id);
            return res.json(metadata);
        }
    } catch (error) {
        console.error('Error in GET /sheets/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update values
// PUT /api/sheets/:id/values
// Body: { range: 'Sheet1!A1', values: [['New Value']] }
router.put('/sheets/:id/values', async (req, res) => {
    const { id } = req.params;
    const { range, values } = req.body;

    if (!range || !values) {
        return res.status(400).json({ error: 'Missing range or values in body' });
    }

    try {
        const result = await sheetsClient.updateValues(id, range, values);
        res.json(result);
    } catch (error) {
        console.error('Error in PUT /sheets/:id/values:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
