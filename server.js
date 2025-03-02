const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const tasksFilePath = path.join(__dirname, 'tasks.json');

app.use(bodyParser.json());

// Middleware to validate task input
const validateTask = (req, res, next) => {
    const { title, status } = req.body;
    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
    }
    if (status && !['pending', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Status must be one of: pending, in-progress, completed.' });
    }
    next();
};

// Read tasks from tasks.json
const readTasks = () => {
    if (!fs.existsSync(tasksFilePath)) {
        fs.writeFileSync(tasksFilePath, JSON.stringify([]));
    }
    const data = fs.readFileSync(tasksFilePath);
    return JSON.parse(data);
};

// Write tasks to tasks.json
const writeTasks = (tasks) => {
    fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
};

// CRUD operations
app.post('/tasks', validateTask, (req, res) => {
    const tasks = readTasks();
    const newTask = { id: Date.now(), ...req.body };
    tasks.push(newTask);
    writeTasks(tasks);
    res.status(201).json(newTask);
});

app.get('/tasks', (req, res) => {
    const tasks = readTasks();
    res.json(tasks);
});

app.put('/tasks/:id', validateTask, (req, res) => {
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(task => task.id === parseInt(req.params.id));
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }
    tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
    writeTasks(tasks);
    res.json(tasks[taskIndex]);
});

app.delete('/tasks/:id', (req, res) => {
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(task => task.id === parseInt(req.params.id));
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found.' });
    }
    tasks.splice(taskIndex, 1);
    writeTasks(tasks);
    res.status(204).send();
});

// Serve the HTML file for testing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});