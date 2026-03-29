import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log("=".repeat(60));
console.log("MongoDB Connection Diagnostic Tool (with secureContext)");
console.log("=".repeat(60));
console.log(`Node version: ${process.version}`);

// Hide password in logs
const hiddenUri = uri.replace(/:[^:@]+@/, ':****@');
console.log(`URI: ${hiddenUri}`);

// Create client with secureContext fix
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 10000,
  secureContext: crypto.createSecureContext({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  }),
});

async function testConnection() {
  try {
    console.log("\n Attempting to connect to MongoDB Atlas with secureContext...");
    
    await client.connect();
    console.log("Connected successfully!");
    
    const db = client.db("adaptivechat");
    console.log(" Database 'adaptivechat' accessible");
    
    const collections = await db.listCollections().toArray();
    console.log(`Collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'none'}`);
    
    console.log("\nSUCCESS: MongoDB connection is working!");
    
  } catch (error) {
    console.error("\n Connection failed:", error.message);
    console.error("Error name:", error.name);
    console.error("Error code:", error.code);
  } finally {
    await client.close();
    console.log("\n" + "=".repeat(60));
    process.exit();
  }
}

testConnection();