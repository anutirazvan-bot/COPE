const express = require('express');
const path = require('path');

const app = express();
const PORT = 4346;

app.use(express.json());

// Serve static files (including zones.json if it's in the same folder)
app.use(express.static(__dirname));

// Global storage array in RAM
let positionsRAM = [];

// Helper function to wipe out records older than 2 hours (7,200,000 milliseconds)
function clearExpiredPositions() {
    positionsRAM = positionsRAM.filter(
        item => item.serverTimestamp > Date.now() - (2 * 60 * 60 * 1000)
    );
}

// GET: Return active positions and current server time
app.get('/positions', (req, res) => {
    clearExpiredPositions();

    res.json({
        positions: positionsRAM.map(({ serverTimestamp, ...rest }) => rest),
             currentTime: Date.now()
    });
});

// POST: Add or update a position
app.post('/positions', (req, res) => {
    clearExpiredPositions();

    const { name, position, building, roof, direction, user } = req.body;

    // Validation
    if (!name || !position || !building || !roof || !direction || !user) {
        return res.status(400).json({
            error: 'Missing required fields.'
        });
    }

    const rawNow = Date.now();

    const newEntry = {
        name,
        position,
        building,
        roof,
        direction,
        user,
        time: rawNow,
        serverTimestamp: rawNow
    };

    const existingIndex = positionsRAM.findIndex(
        item => item.name === name
    );

    if (existingIndex !== -1) {
        positionsRAM[existingIndex] = newEntry;
    } else {
        positionsRAM.push(newEntry);
    }

    const { serverTimestamp, ...publicReceipt } = newEntry;

    res.status(201).json({
        message: 'Position successfully registered.',
        entry: publicReceipt
    });
});

// Explicit endpoint for zones.json
app.get('/zones.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'zones.json'));
});

// Optional alias
app.get('/zones', (req, res) => {
    res.sendFile(path.join(__dirname, 'zones.json'));
});

// Start server
app.listen(PORT, () => {
    console.log(`COPE RAM Server running on port ${PORT} using raw timestamps`);
    console.log(`Positions API: http://localhost:${PORT}/positions`);
    console.log(`Zones JSON:    http://localhost:${PORT}/zones.json`);
});
