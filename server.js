const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'clinics.json');

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/save-clinics', (req, res) => {
  try {
    const clinics = req.body;
    if (!Array.isArray(clinics)) {
      return res.status(400).json({ error: 'Expected an array of clinics' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(clinics, null, 2), 'utf8');
    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('Failed to save clinics', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
