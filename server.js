const express = require('express');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 3000;

// Use CORS to allow cross-origin requests
app.use(cors());

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db, collection;

client.connect().then(() => {
    db = client.db('media_library');
    collection = db.collection('media');
    console.log('Connected to MongoDB');
});

// Set up multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// POST route to upload both an image and a song
app.post('/upload', upload.fields([{ name: 'image' }, { name: 'song' }]), async (req, res) => {
    const { title, description, artist, album } = req.body;
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    const songFile = req.files['song'] ? req.files['song'][0] : null;

    if (!imageFile || !songFile) {
        console.error('Both image and song files are required.');
        return res.status(400).send('Both image and song files are required.');
    }

    const document = {
        title,
        uploadedAt: new Date(),
        image: {
            filename: imageFile.originalname,
            contentType: imageFile.mimetype,
            data: imageFile.buffer.toString('base64'),
            description
        },
        song: {
            filename: songFile.originalname,
            contentType: songFile.mimetype,
            data: songFile.buffer.toString('base64'),
            artist,
            album
        }
    };

    try {
        const result = await collection.insertOne(document);
        console.log('Inserted document ID:', result.insertedId);
        res.status(201).send({ message: 'Files uploaded successfully', id: result.insertedId });
    } catch (err) {
        console.error('Error during file upload:', err);
        res.status(500).send('Error uploading files');
    }
});

// GET route to retrieve all media files
app.get('/media', async (req, res) => {
    try {
        const media = await collection.find({}).toArray(); // Fetch all documents
        res.status(200).json(media); // Send them back as JSON without modifying data
    } catch (err) {
        console.error('Error retrieving all media files:', err);
        res.status(500).send('Error retrieving media files');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
