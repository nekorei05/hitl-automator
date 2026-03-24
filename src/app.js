require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const promptRoutes = require('./routes/prompt');
const tasksRoutes = require('./routes/tasks');

const app = express();

connectDB();

// Middleware
app.use(express.json());
app.use(express.static('public')); 

app.use('/prompt', promptRoutes);
app.use('/tasks', tasksRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});