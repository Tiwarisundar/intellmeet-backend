// seedTasks.js
// Run this ONCE from your backend project root to add example tasks for testing.
//
// Usage:
//   node seedTasks.js
//
// Before running:
// 1. Adjust the require paths below to match your project structure
// 2. Replace YOUR_USER_ID and YOUR_MONGO_URI with real values

const mongoose = require('mongoose');
const Task = require('./models/Task');       // <-- adjust path to your Task model
require('dotenv').config();                   // <-- if you use a .env file for MONGO_URI

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet_new';

// Replace with a real User _id from your users collection
// (open MongoDB Compass -> users collection -> copy any _id)
const YOUR_USER_ID = 'YOUR_USER_ID_HERE';

const sampleTasks = [
  {
    title: 'Work on backend API',
    description: 'Build and test the tasks API endpoints',
    status: 'todo',
    priority: 'high',
    assigneeName: 'Pankaj',
    createdBy: YOUR_USER_ID
  },
  {
    title: 'Design login page',
    description: 'Create UI mockup for login/signup flow',
    status: 'todo',
    priority: 'medium',
    assigneeName: 'Rahul',
    createdBy: YOUR_USER_ID
  },
  {
    title: 'Integrate video call SDK',
    description: 'Connect WebRTC/Zoom SDK to meeting room',
    status: 'in-progress',
    priority: 'high',
    assigneeName: 'Ankit',
    createdBy: YOUR_USER_ID
  },
  {
    title: 'Fix dashboard responsiveness',
    description: 'Dashboard breaking on mobile screens below 400px',
    status: 'review',
    priority: 'low',
    assigneeName: 'Mohan',
    createdBy: YOUR_USER_ID
  },
  {
    title: 'Setup project repo',
    description: 'Initialize repo, folder structure, and CI',
    status: 'done',
    priority: 'medium',
    assigneeName: 'Pankaj',
    createdBy: YOUR_USER_ID
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const created = await Task.insertMany(sampleTasks);
    console.log(`Inserted ${created.length} example tasks:`);
    created.forEach(t => console.log(`- [${t.status}] ${t.title}`));

    await mongoose.disconnect();
    console.log('Done. You can now refresh your dashboard.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();