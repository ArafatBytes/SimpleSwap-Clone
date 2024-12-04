import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Verification from '@/lib/models/Verification';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';

// Function to convert file to base64
async function fileToBase64(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    return buffer.toString('base64');
}

// Function to delete file if it exists (only in development)
async function deleteFile(filePath) {
    if (process.env.NODE_ENV === 'development') {
        try {
            const fullPath = path.join(process.cwd(), 'public', filePath);
            await unlink(fullPath);
        } catch (error) {
            console.log('File deletion error (can be ignored if file not found):', error);
        }
    }
}

// Function to get user from JWT token
const getUserFromToken = async (request) => {
    try {
        const cookies = request.cookies;
        const token = cookies.get('token')?.value;
        
        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            _id: decoded.userId,
            email: decoded.email
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};

// Function to save file and return the path or base64 data
async function saveFile(file, userId, type) {
    if (!file) return null;

    try {
        if (process.env.NODE_ENV === 'development') {
            // Development: Save to filesystem
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'verifications');
            try {
                await writeFile(uploadsDir, '', { flag: 'wx' });
            } catch (err) {
                if (err.code !== 'EEXIST') throw err;
            }

            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const filename = `${userId}_${type}_${timestamp}.${extension}`;
            const filepath = path.join(uploadsDir, filename);

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(filepath, buffer);

            return `/uploads/verifications/${filename}`;
        } else {
            // Production: Convert to base64
            const base64Data = await fileToBase64(file);
            const extension = file.name.split('.').pop();
            return `data:image/${extension};base64,${base64Data}`;
        }
    } catch (error) {
        console.error('Error handling file:', error);
        return null;
    }
}

export async function POST(request) {
    try {
        // Verify user authentication
        const user = await getUserFromToken(request);
        if (!user || !user._id) {
            return NextResponse.json({ 
                success: false, 
                message: 'Unauthorized - No valid token found' 
            }, { status: 401 });
        }

        // Connect to database
        await dbConnect();

        const formData = await request.formData();
        const userId = user._id;

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

        // If updating and in development, delete old files
        if (existingDoc) {
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
            verificationStatus: 'Unverified', // Always set to Unverified when submitting/resubmitting
            updatedAt: new Date()
        };

        let result;
        if (existingDoc) {
            // Update existing document
            result = await Verification.findOneAndUpdate(
                { userId: userId },
                verificationData,
                { new: true }
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
