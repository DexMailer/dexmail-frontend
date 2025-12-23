import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { email, password, signature, authType, walletAddress } = body;

        console.log('[Login API] Login attempt:', { email, walletAddress, authType });

        // For coinbase-embedded, use wallet address as the primary identifier
        let user;
        if (authType === 'coinbase-embedded' && walletAddress) {
            user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
            console.log('[Login API] Looking up by wallet address:', walletAddress);
        } else if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
            console.log('[Login API] Looking up by email:', email);
        }

        console.log('[Login API] User found:', user ? { email: user.email, authType: user.authType, walletAddress: user.walletAddress } : 'null');

        if (!user) {
            console.log('[Login API] User not found');
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
            const { message, signature } = body;

            if (!signature || !message) {
                return NextResponse.json(
                    { error: 'Signature and message are required for wallet login' },
                    { status: 400 }
                );
            }

            try {
                const { SiweMessage } = await import('siwe');
                const siweMessage = new SiweMessage(message);

                // Verify the signature
                const fields = await siweMessage.verify({ signature });

                // Fields.data.address is the address that signed the message
                const recoveredAddress = fields.data.address;

                if (recoveredAddress.toLowerCase() !== user.walletAddress?.toLowerCase()) {
                    // Check if user has a wallet address linked. If not, maybe we should link it?
                    // Current logic expects user.walletAddress to match.
                    if (!user.walletAddress) {
                        return NextResponse.json(
                            { error: 'No wallet linked to this account' },
                            { status: 400 }
                        );
                    }

                    return NextResponse.json(
                        { error: 'Invalid signature for this user' },
                        { status: 401 }
                    );
                }

                // Also verify nonce if we were storing it.
                // For now, we verified the signature is valid for the message.

            } catch (e) {
                console.error('SIWE Verification failed:', e);
                return NextResponse.json(
                    { error: 'Invalid signature' },
                    { status: 401 }
                );
            }
        } else if (authType === 'coinbase-embedded') {
            console.log('[Login API] Coinbase embedded auth, user authType:', user.authType);
            // For Coinbase embedded wallets, OTP verification already happened on frontend
            // We just need to verify the user exists and has the correct auth type
            if (user.authType !== 'coinbase-embedded') {
                console.log('[Login API] User authType mismatch:', user.authType, '!== coinbase-embedded');
                return NextResponse.json(
                    { error: 'Account not registered with embedded wallet' },
                    { status: 400 }
                );
            }
            console.log('[Login API] Embedded wallet auth successful');
            // No additional validation needed - OTP verification is sufficient
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
