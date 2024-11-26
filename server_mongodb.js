const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// MongoDB Connection URL - Replace with your actual connection string from MongoDB Atlas
const mongoUrl = "mongodb+srv://sumithshaha:H89aESnYecX7AuXt@cluster0.qhals.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "moviesDB";
const collectionName = "movies";

let db;

// Connect to MongoDB
async function connectToMongo() {
    try {
        const client = await MongoClient.connect(mongoUrl);
        db = client.db(dbName);
        console.log('Connected successfully to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

// Initialize MongoDB connection
connectToMongo();

// Utility function to transform MongoDB document
function transformDocument(doc) {
    if (!doc) return null;
    return {
        id: doc._id.toString(),
        title: doc.title,
        director: doc.director,
        year: doc.year
    };
}

// GET /movies - Fetch all movies
app.get('/movies', async (req, res) => {
    try {
        const { title, director, year } = req.query;
        let query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }
        if (director) {
            query.director = { $regex: director, $options: 'i' };
        }
        if (year) {
            query.year = parseInt(year);
        }

        const movies = await db.collection(collectionName)
            .find(query)
            .toArray();
        
        const transformedMovies = movies.map(transformDocument);
        res.json(transformedMovies);
    } catch (err) {
        console.error('Error fetching movies:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /movies/:id - Get specific movie
app.get('/movies/:id', async (req, res) => {
    try {
        const movie = await db.collection(collectionName)
            .findOne({ _id: new ObjectId(req.params.id) });

        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.json(transformDocument(movie));
    } catch (err) {
        console.error('Error fetching movie:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /movies - Add new movie
app.post('/movies', async (req, res) => {
    try {
        const { title, director, year } = req.body;

        // Validate required fields
        if (!title || !director || !year) {
            return res.status(400).json({ error: 'Title, director, and year are required' });
        }

        // Validate year
        const yearNum = parseInt(year);
        const currentYear = new Date().getFullYear();
        if (isNaN(yearNum) || yearNum < 1888 || yearNum > currentYear) {
            return res.status(400).json({ error: 'Invalid year' });
        }

        const newMovie = {
            title,
            director,
            year: yearNum
        };

        const result = await db.collection(collectionName)
            .insertOne(newMovie);

        const insertedMovie = transformDocument({
            _id: result.insertedId,
            ...newMovie
        });

        res.status(201).json({
            message: 'Movie successfully created!',
            movie: insertedMovie
        });
    } catch (err) {
        console.error('Error creating movie:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /movies/:id - Update movie
app.put('/movies/:id', async (req, res) => {
    try {
        const { title, director, year } = req.body;

        // Validate required fields
        if (!title || !director || !year) {
            return res.status(400).json({ error: 'Title, director, and year are required' });
        }

        // Validate year
        const yearNum = parseInt(year);
        const currentYear = new Date().getFullYear();
        if (isNaN(yearNum) || yearNum < 1888 || yearNum > currentYear) {
            return res.status(400).json({ error: 'Invalid year' });
        }

        // Check if movie exists first
        const movieExists = await db.collection(collectionName)
            .findOne({ _id: new ObjectId(req.params.id) });

        if (!movieExists) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Update the movie
        const updatedMovie = await db.collection(collectionName)
            .findOneAndUpdate(
                { _id: new ObjectId(req.params.id) },
                { $set: { title, director, year: yearNum } },
                { returnDocument: 'after' }
            );

        res.json({
            message: 'Movie successfully updated!',
            movie: transformDocument(updatedMovie)
        });
    } catch (err) {
        console.error('Error updating movie:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /movies/:id - Delete movie
app.delete('/movies/:id', async (req, res) => {
    try {
        const result = await db.collection(collectionName)
            .deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.status(200).json({
            message: 'Movie successfully deleted!'
        });
    } catch (err) {
        console.error('Error deleting movie:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Error handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});