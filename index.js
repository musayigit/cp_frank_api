const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const port = 3100;

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return '0.0.0.0';
}

const localIP = getLocalIP();

app.use(cors());

['CancellationFiles', 'BookingFiles'].forEach(dir => {
    const dirPath = path.join(__dirname, 'uploads', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folder = file.fieldname === 'cancelletionFile' 
            ? 'CancellationFiles' 
            : 'BookingFiles';
        cb(null, `uploads/${folder}/`);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10 // max. file count
    }
});

const fileFields = [
    { name: 'cancelletionFile', maxCount: 5 },
    { name: 'bookingFiles', maxCount: 5 }
];

app.post('/upload', upload.fields(fileFields), (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('Dosya yüklenmedi');
        }
        
        const uploadedFiles = {};
        Object.keys(req.files).forEach(fieldName => {
            uploadedFiles[fieldName] = req.files[fieldName].map(file => ({
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype
            }));
        });

        res.json({
            message: 'file uploaded',
            files: uploadedFiles
        });
    } catch (error) {
        res.status(500).send('file upload error: ' + error.message);
    }
});

app.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.sendFile(filePath);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on:`);
    console.log(`- http://localhost:${port}`);
    console.log(`- http://${localIP}:${port}`);
});