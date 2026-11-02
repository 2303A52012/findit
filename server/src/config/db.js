const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/findit';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    const isRemote = uri.includes('@') || uri.includes('mongodb.net');
    console.log(`Connected to MongoDB (${isRemote ? 'Remote Atlas Cluster' : 'Local Instance'})`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

module.exports = { connectDatabase };
