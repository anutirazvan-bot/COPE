    const express = require('express');
    const fs = require('fs');

    const app = express();
    app.use(express.json());
    app.use(express.static(__dirname));

    const FILE = './positions.json';
    const TTL = 2 * 60 * 60 * 1000; // 2 hours

    function load() {
        if (!fs.existsSync(FILE)) return [];
        return JSON.parse(fs.readFileSync(FILE));
    }

    function save(data) {
        fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
    }

    /* CLEANUP OLD POINTS */
    function cleanup() {
        let data = load();
        const now = Date.now();

        // Remove expired positions
        data = data.filter(p => {
            const t = new Date(p.time).getTime();
            return now - t < TTL;
        });

        // Keep only the newest position for each name
        const newest = new Map();

        for (const p of data) {
            const existing = newest.get(p.name);

            if (
                !existing ||
                new Date(p.time).getTime() > new Date(existing.time).getTime()
            ) {
                newest.set(p.name, p);
            }
        }

        save([...newest.values()]);
    }

    /* API */
    app.get('/positions', (req,res) => {
        cleanup();
        res.json(load());
    });

    app.post('/positions', (req,res) => {
        cleanup();
        save(req.body);
        res.json({ok:true});
    });

    /* periodic cleanup */
    setInterval(cleanup, 5 * 60 * 1000);

    app.listen(8080, "0.0.0.0", () => {
        console.log("COPE running http://localhost:8080");
    });
