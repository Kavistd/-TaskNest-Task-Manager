const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
// Increase JSON body limit to allow base64 images for task cover uploads
app.use(express.json({ limit: '10mb' }));

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tasknest';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000, // Increased timeout
    };

    await mongoose.connect(MONGO_URI, connectionOptions);
    console.log('MongoDB connected successfully');
    
    // Check connection state
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
  } catch (err) {
    console.error('\n❌ MongoDB connection error:', err.message);
    
    // Provide helpful error messages based on error type
    if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error('\n🔐 Authentication Error:');
      console.error('   Your MongoDB credentials are incorrect.');
      console.error('   Please check your .env file and verify:');
      console.error('   1. Username and password in MONGO_URI are correct');
      console.error('   2. If using MongoDB Atlas, ensure your IP is whitelisted');
      console.error('   3. Database user has proper permissions');
      console.error('\n   Example MONGO_URI format:');
      console.error('   mongodb://[username]:[password]@[cluster].mongodb.net/[database]');
      console.error('   OR for local MongoDB:');
      console.error('   mongodb://localhost:27017/[database]');
    } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
      console.error('\n🌐 Connection Error:');
      console.error('   Cannot reach MongoDB server.');
      console.error('   Please check if MongoDB is running or the connection string is correct.');
    } else {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check if MongoDB is running (for local)');
      console.error('   2. Verify MONGO_URI in .env file');
      console.error('   3. Check network connectivity (for Atlas)');
    }
    
    console.error('\n📝 Current MONGO_URI:', MONGO_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    process.exit(1); // Exit if database connection fails
  }
};

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/tasks', require('./routes/tasks'));

app.get('/', (req, res) => {
  res.send('Task Manager API is running');
});

// Start server only after database connection
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
