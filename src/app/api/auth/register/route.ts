import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { email, password, authType, walletAddress, signature } = body;

        if (!email || !authType) {
            return NextResponse.json(
                { error: 'Email and authType are required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists with this email' },
                { status: 400 }
            );
        }

        // Validate based on auth type
        if (authType === 'traditional' && !password) {
            return NextResponse.json(
                { error: 'Password is required for traditional registration' },
                { status: 400 }
            );
        }

        if (authType === 'wallet') {
            const { message, signature } = body;

            if (!walletAddress || !message || !signature) {
                return NextResponse.json(
                    { error: 'Wallet address, message, and signature are required for wallet registration' },
                    { status: 400 }
                );
            }

            try {
                const { SiweMessage } = await import('siwe');
                const siweMessage = new SiweMessage(message);

                // Verify the signature
                const fields = await siweMessage.verify({ signature });
                const recoveredAddress = fields.data.address;

                if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                    return NextResponse.json(
                        { error: 'Signature does not match provided wallet address' },
                        { status: 400 }
                    );
                }
            } catch (e) {
                console.error('SIWE Verification failed:', e);
                return NextResponse.json(
                    { error: 'Invalid signature for registration' },
                    { status: 400 }
                );
            }
        }

        // Check if wallet address is already taken (if provided)
        if (walletAddress) {
            const existingWalletUser = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
            if (existingWalletUser) {
                return NextResponse.json(
                    { error: 'This wallet address is already registered' },
                    { status: 400 }
                );
            }
        }

        // Create new user
        const userData: any = {
            email: email.toLowerCase(),
            authType,
            emailVerified: authType === 'wallet', // Auto-verify wallet users
        };

        if (password) {
            userData.password = password;
        }

        if (walletAddress) {
            userData.walletAddress = walletAddress.toLowerCase();
        }

        const user = new User(userData);
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
        };

        return NextResponse.json({
            token,
            user: userResponse,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration error:', error);

        if (error.code === 11000) {
            if (Object.keys(error.keyPattern).includes('walletAddress')) {
                return NextResponse.json(
                    { error: 'This wallet address is already registered' },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Registration failed' },
            { status: 500 }
        );
    }
}
