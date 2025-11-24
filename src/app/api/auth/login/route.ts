import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { email, password, signature, authType } = body;

        if (!email || !authType) {
            return NextResponse.json(
                { error: 'Email and authType are required' },
                { status: 400 }
            );
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Validate based on auth type
        if (authType === 'traditional') {
            if (!password) {
                return NextResponse.json(
                    { error: 'Password is required' },
                    { status: 400 }
                );
            }

            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return NextResponse.json(
                    { error: 'Invalid credentials' },
                    { status: 401 }
                );
            }
        } else if (authType === 'wallet') {
            if (!signature) {
                return NextResponse.json(
                    { error: 'Signature is required for wallet login' },
                    { status: 400 }
                );
            }

            // In a production app, you would verify the signature here
            // For now, we trust that the wallet connection is valid
            if (!user.walletAddress) {
                return NextResponse.json(
                    { error: 'No wallet linked to this account' },
                    { status: 400 }
                );
            }
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                authType: user.authType
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data (excluding password)
        const userResponse = {
            email: user.email,
            authType: user.authType,
            walletAddress: user.walletAddress || null,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt.toISOString(),
            lastLogin: user.lastLogin.toISOString(),
        };

        return NextResponse.json({
            token,
            user: userResponse,
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}
