import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Verification from '@/lib/models/Verification';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

// Function to delete file if it exists
async function deleteFile(filePath) {
    try {
        // Convert URL path to filesystem path
        const fullPath = path.join(process.cwd(), 'public', filePath);
        await unlink(fullPath);
    } catch (error) {
        // Ignore errors if file doesn't exist
        console.log('File deletion error (can be ignored if file not found):', error);
    }
}

// Function to get user from JWT token
const getUserFromToken = async (request) => {
    try {
        // Get the token from cookies
        const cookies = request.cookies;
        const token = cookies.get('token')?.value;
        
        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            _id: decoded.userId,  // Make sure we use the correct property name
            email: decoded.email
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};

// Function to save file and return the file path
async function saveFile(file, userId, type) {
    if (!file) return null;

    try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'verifications');
        try {
            await writeFile(uploadsDir, '', { flag: 'wx' });
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }

        // Generate unique filename using userId
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `${userId}_${type}_${timestamp}.${extension}`;
        const filepath = path.join(uploadsDir, filename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // Return the public URL
        return `/uploads/verifications/${filename}`;
    } catch (error) {
        console.error('Error saving file:', error);
        return null;
    }
}

export async function POST(request) {
    try {
        // Verify user authentication
        const user = await getUserFromToken(request);
        console.log('User from token:', user); // Debug log

        if (!user || !user._id) {
            return NextResponse.json({ 
                success: false, 
                message: 'Unauthorized - No valid token found' 
            }, { status: 401 });
        }

        // Connect to database
        await dbConnect();

        const formData = await request.formData();
        
        // Use the actual user ID from the token
        const userId = user._id;
        console.log('Using userId:', userId); // Debug log

        // Check if a verification document already exists for this user
        const existingDoc = await Verification.findOne({ userId: userId });
        
        // Save uploaded files
        const frontImagePath = await saveFile(formData.get('frontImage'), userId, 'front');
        const backImagePath = await saveFile(formData.get('backImage'), userId, 'back');
        const selfieImagePath = await saveFile(formData.get('selfieImage'), userId, 'selfie');

        if (!frontImagePath || !backImagePath || !selfieImagePath) {
            return NextResponse.json({
                success: false,
                message: 'All document images are required'
            }, { status: 400 });
        }

        // If updating, delete old files
        if (existingDoc) {
            // Delete previous images
            await deleteFile(existingDoc.frontImage);
            await deleteFile(existingDoc.backImage);
            await deleteFile(existingDoc.selfieImage);
        }

        // Create verification document data
        const verificationData = {
            userId: userId,
            email: user.email,
            documentType: formData.get('documentType'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            dateOfBirth: formData.get('dateOfBirth'),
            documentNumber: formData.get('documentNumber'),
            frontImage: frontImagePath,
            backImage: backImagePath,
            selfieImage: selfieImagePath,
            verificationStatus: 'Unverified',
            updatedAt: new Date()
        };

        let result;
        if (existingDoc) {
            // Update existing document
            result = await Verification.findOneAndUpdate(
                { userId: userId },
                verificationData,
                { new: true } // Return the updated document
            );
        } else {
            // Create new document
            result = await Verification.create({
                ...verificationData,
                submittedAt: new Date()
            });
        }
        
        return NextResponse.json({ 
            success: true, 
            message: existingDoc ? 'Verification documents updated successfully' : 'Verification documents received successfully'
        });
    } catch (error) {
        console.error('Verification submission error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to process verification' },
            { status: 500 }
        );
    }
}
