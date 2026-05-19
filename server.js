const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(__dirname));

app.post('/api/save-users', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'user.JSON');
    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true, message: 'Physical user.JSON updated successfully.' });
    } catch (err) {
        console.error("Error writing to user.JSON:", err);
        res.status(500).json({ success: false, message: 'Failed to write to file.' });
    }
});

app.post('/api/save-approvals', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'approvals.JSON');
    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true, message: 'Physical approvals.JSON updated successfully.' });
    } catch (err) {
        console.error("Error writing to approvals.JSON:", err);
        res.status(500).json({ success: false, message: 'Failed to write to file.' });
    }
});

app.post('/api/save-pets', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'pets.JSON');
    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true, message: 'Physical pets.JSON updated successfully.' });
    } catch (err) {
        console.error("Error writing to pets.JSON:", err);
        res.status(500).json({ success: false, message: 'Failed to write to file.' });
    }
});

app.listen(3000, () => {
    console.log('====================================================');
    console.log('🚀 PetAid High-Capacity JSON Engine running!');
    console.log('👉 Open your browser to: http://localhost:3000/firstAid.html');
    console.log('Press Ctrl + C in this terminal window to stop the server.');
    console.log('====================================================');
});