const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(express.static(__dirname));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'profiles'; 

        if (req.body.uploadType === 'pet') {
            folder = 'petprofile';
        } else if (req.body.uploadType === 'cert') {
            folder = 'certs';
        } else if (req.body.uploadType === 'guide') {
            folder = 'guides';
        }
        const dir = path.join(__dirname, 'assets', folder);
        
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const id = req.body.id || 'unknown';
        const ext = path.extname(file.originalname).toLowerCase(); 
        
        let prefix = 'user';
        if (req.body.uploadType === 'pet') {
            prefix = 'pet';
        } else if (req.body.uploadType === 'cert') {
            prefix = 'cert';
        } else if (req.body.uploadType === 'guide') {
            prefix = 'step';
        }
        cb(null, `${prefix}_${id}${ext}`);
    }
});

const upload = multer({ storage: storage });

app.post('/api/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    let folder = 'profiles';
    if (req.body.uploadType === 'pet') folder = 'petprofile';
    if (req.body.uploadType === 'cert') folder = 'certs';
    if (req.body.uploadType === 'guide') folder = 'guides';
    const cleanPath = `assets/${folder}/${req.file.filename}`;
    res.json({ 
        success: true, 
        message: 'File written onto physical disk smoothly!', 
        savedPath: cleanPath 
    });
});

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

app.post('/api/save-quizzes', (req, res) => {
    const filePath = path.join(
        __dirname,
        'data',
        'quizzes.JSON'
    );

    try {
        fs.writeFileSync(
            filePath,
            JSON.stringify(req.body, null, 2),
            'utf8'
        );

        res.json({
            success: true,
            message: 'Physical quizzes.JSON updated successfully.'
        });

    } catch (err) {
        console.error(
            "Error writing to quizzes.JSON:",
            err
        );

        res.status(500).json({
            success: false,
            message: 'Failed to write to file.'
        });
    }
});

app.post('/api/save-guides', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'sampleGuides.JSON');
    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true, message: 'Physical sampleGuides.JSON updated successfully.' });
    } catch (err) {
        console.error("Error writing to sampleGuides.JSON:", err);
        res.status(500).json({ success: false, message: 'Failed to write to file.' });
    }
});

app.post('/api/save-forum-posts', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'forum.JSON');

    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true, message: 'Forum updated successfully.' });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.listen(3000, () => {
    console.log('====================================================');
    console.log('PetAid JSON Engine running!');
    console.log('Open your browser to: http://localhost:3000/firstAid.html');
    console.log('Press Ctrl + C in this terminal window to stop the server.');
    console.log('====================================================');
});
