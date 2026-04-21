// ExNo:8 - Express.js based Web Development
// Demonstrates: Express routing, GET/POST, middleware, fs, path modules

const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 4000;

// MongoDB connection - new database 'tutorial3_db'
const MONGO_URI = 'mongodb://127.0.0.1:27017/tutorial3_db';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected to tutorial3_db'))
    .catch(err => console.error('MongoDB connection error:', err.message));

// Mongoose schema & model for students
const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    course: { type: String, default: 'Full Stack Development' },
    marks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const Student = mongoose.model('Student', studentSchema);

// Middleware - parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware - serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Custom middleware - log every request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Path to users data file
const usersFile = path.join(__dirname, 'data', 'users.json');

// Helper: read users from JSON file
function readUsers() {
    if (!fs.existsSync(usersFile)) return [];
    const data = fs.readFileSync(usersFile, 'utf-8');
    return data ? JSON.parse(data) : [];
}

// Helper: write users to JSON file
function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// GET / - Home page (served from public/index.html via static middleware, fallback below)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /about - Simple route
app.get('/about', (req, res) => {
    res.send('<h1>About</h1><p>Express.js example for ExNo:8</p><a href="/">Home</a>');
});

// GET /greet/:name - Route parameters
app.get('/greet/:name', (req, res) => {
    const { name } = req.params;
    res.send(`<h1>Hello, ${name}!</h1><a href="/">Home</a>`);
});

// GET /users - Read all users (fs module)
app.get('/users', (req, res) => {
    const users = readUsers();
    res.json(users);
});

// GET /users/:id - Get single user
app.get('/users/:id', (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

// POST /users - Create a new user
app.post('/users', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    const users = readUsers();
    const newUser = {
        id: users.length ? users[users.length - 1].id + 1 : 1,
        name,
        email,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);
    res.status(201).json(newUser);
});

// PUT /users/:id - Update a user
app.put('/users/:id', (req, res) => {
    const users = readUsers();
    const index = users.findIndex(u => u.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    users[index] = { ...users[index], ...req.body };
    writeUsers(users);
    res.json(users[index]);
});

// DELETE /users/:id - Delete a user
app.delete('/users/:id', (req, res) => {
    let users = readUsers();
    const exists = users.some(u => u.id === parseInt(req.params.id));
    if (!exists) return res.status(404).json({ error: 'User not found' });
    users = users.filter(u => u.id !== parseInt(req.params.id));
    writeUsers(users);
    res.json({ message: 'User deleted successfully' });
});

// POST /form - Handle HTML form submission
app.post('/form', (req, res) => {
    const { username, message } = req.body;
    res.send(`
        <h1>Form Submitted</h1>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Message:</strong> ${message}</p>
        <a href="/">Home</a>
    `);
});

// GET /file - Read a file via fs
app.get('/file', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'info.txt');
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) return res.status(404).send('File not found');
        res.type('text/plain').send(data);
    });
});

// ========== MongoDB Routes (separate URL for POST with mongosh db) ==========

// POST /mongo/students - Create student in MongoDB (tutorial3_db)
app.post('/mongo/students', async (req, res) => {
    try {
        const { name, rollNo, course, marks } = req.body;
        if (!name || !rollNo) {
            return res.status(400).json({ error: 'name and rollNo are required' });
        }
        const student = new Student({ name, rollNo, course, marks });
        const saved = await student.save();
        res.status(201).json({ message: 'Saved to MongoDB', student: saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /mongo/students - List all students from MongoDB
app.get('/mongo/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /mongo/students/:id - Get single student
app.get('/mongo/students/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'Not found' });
        res.json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /mongo/students/:id - Delete from MongoDB
app.delete('/mongo/students/:id', async (req, res) => {
    try {
        const deleted = await Student.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted from MongoDB', deleted });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('<h1>404 - Route not found</h1><a href="/">Home</a>');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}/`);
    console.log('Routes:');
    console.log('  GET    /              - Home page');
    console.log('  GET    /about         - About page');
    console.log('  GET    /greet/:name   - Greet by route param');
    console.log('  GET    /users         - Get all users');
    console.log('  GET    /users/:id     - Get one user');
    console.log('  POST   /users         - Create user');
    console.log('  PUT    /users/:id     - Update user');
    console.log('  DELETE /users/:id     - Delete user');
    console.log('  POST   /form          - Handle form data');
    console.log('  GET    /file          - Read info.txt');
    console.log('  --- MongoDB (tutorial3_db) ---');
    console.log('  POST   /mongo/students     - Create student in MongoDB');
    console.log('  GET    /mongo/students     - List students from MongoDB');
    console.log('  GET    /mongo/students/:id - Get one student');
    console.log('  DELETE /mongo/students/:id - Delete from MongoDB');
});
