const express = require('express');
const bodyParser = require('body-parser');
const Joi = require('joi');
const db = require('./db');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
 

// Validation Schema for Notes
const noteSchema = Joi.object({
    title: Joi.string().min(3).required(),
    description: Joi.string().min(5).required(),
    category: Joi.string().valid('Work', 'Personal', 'Others').default('Others'),
});

// Create a new note
app.post('/notes', (req, res) => {
    const { error } = noteSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { title, description, category } = req.body;
    const sql = 'INSERT INTO notes (title, description, category) VALUES (?, ?, ?)';
    db.run(sql, [title, description, category], function (err) {
        if (err) {
            return res.status(500).send('Error adding note');
        }
        res.status(201).send({ id: this.lastID, title, description, category });
    });
});

// Get all notes with optional search/filter
app.get('/notes', (req, res) => {
    const { category, search } = req.query;
    let query = 'SELECT * FROM notes WHERE 1=1';
    const params = [];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    if (search) {
        query += ' AND title LIKE ?';
        params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).send('Error retrieving notes');
        res.json(rows);
    });
});

// Update a note
app.put('/notes/:id', (req, res) => {
    const { error } = noteSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { title, description, category } = req.body;
    const { id } = req.params;

    const sql = 'UPDATE notes SET title = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [title, description, category, id], function (err) {
        if (err) {
            return res.status(500).send('Error updating note');
        }
        res.send({ id, title, description, category });
    });
});

// Delete a note
app.delete('/notes/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM notes WHERE id = ?';
    db.run(sql, [id], function (err) {
        if (err) {
            return res.status(500).send('Error deleting note');
        }
        if (this.changes === 0) {
            return res.status(404).send('Note not found');
        }
        res.send('Note deleted successfully');
    });
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
