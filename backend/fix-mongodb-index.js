require('dotenv').config({ path: './src/.env' });
const mongoose = require('mongoose');

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('resumes');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    // Drop the problematic fileHash_1 index if it exists
    try {
      await collection.dropIndex('fileHash_1');
      console.log('✅ Dropped fileHash_1 index');
    } catch (err) {
      console.log('ℹ️ fileHash_1 index does not exist (this is fine)');
    }
    
    console.log('✅ Database fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixIndex();
