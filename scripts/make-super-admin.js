import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const makeAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update the user with SUPER_ADMIN_EMAIL to be an admin
        const result = await mongoose.connection.collection('users').updateOne(
            { email: process.env.SUPER_ADMIN_EMAIL },
            { $set: { isAdmin: true } }
        );

        if (result.matchedCount === 0) {
            console.error('User not found. Make sure you have registered with this email first.');
        } else if (result.modifiedCount === 0) {
            console.log('User is already an admin.');
        } else {
            console.log('Successfully made user an admin!');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

makeAdmin();
