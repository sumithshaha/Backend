const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initial movies data
let movies = [
    { id: 1, title: "Inception", director: "Christopher Nolan", year: 2010 },
    { id: 2, title: "The Matrix", director: "The Wachowskis", year: 1999 },
    { id: 3, title: "Parasite", director: "Bong Joon-ho", year: 2019 }
];

// Default route - HTML page showing all movies
app.get('/', (req, res) => {
    const movieList = movies.map(movie => 
        `<li>
            <strong>${movie.title}</strong> (${movie.year})
            <br/>
            Directed by: ${movie.director}
        </li>`
    ).join('');

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Movie Collection</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    h1 {
                        color: #333;
                    }
                    ul {
                        list-style-type: none;
                        padding: 0;
                    }
                    li {
                        margin-bottom: 20px;
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                    }
                </style>
            </head>
            <body>
                <h1>Movie Collection</h1>
                <ul>${movieList}</ul>
            </body>
        </html>
    `;
    res.send(html);
});

// GET /movies - List all movies
app.get('/movies', (req, res) => {
    res.json(movies);
});

// POST /movies - Add a new movie
app.post('/movies', (req, res) => {
    const { title, director, year } = req.body;
    
    // Input validation
    if (!title || !director || !year) {
        return res.status(400).json({ 
            error: 'Please provide title, director, and year' 
        });
    }

    // Generate new ID (simple implementation)
    const newId = movies.length > 0 
        ? Math.max(...movies.map(m => m.id)) + 1 
        : 1;

    const newMovie = {
        id: newId,
        title,
        director,
        year
    };

    movies.push(newMovie);
    res.status(201).json(newMovie);
});

// GET /movies/:id - Get a movie by ID
app.get('/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const movie = movies.find(m => m.id === id);

    if (movie) {
        res.json(movie);
    } else {
        res.status(404).json({ error: 'Movie not found' });
    }
});

// PUT /movies/:id - Update a movie
app.put('/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { title, director, year } = req.body;

    // Input validation
    if (!title || !director || !year) {
        return res.status(400).json({ 
            error: 'Please provide title, director, and year' 
        });
    }

    const movieIndex = movies.findIndex(m => m.id === id);
    if (movieIndex === -1) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    // Update movie
    const updatedMovie = {
        id,
        title,
        director,
        year
    };

    movies[movieIndex] = updatedMovie;
    res.json(updatedMovie);
});

// DELETE /movies/:id - Delete a movie
app.delete('/movies/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const movieIndex = movies.findIndex(m => m.id === id);

    if (movieIndex === -1) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    // Remove movie from array
    movies.splice(movieIndex, 1);
    res.status(204).send();
});

// Start the server
app.listen(port, () => {
    console.log(`Movie API server running at http://localhost:${port}`);
});
