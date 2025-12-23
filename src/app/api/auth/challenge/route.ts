import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from 'siwe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Note: Email might not be strictly required for *getting* a nonce in a pure SIWE flow, 
        // but existing app logic uses it. We keep it optionally or require it if the app flow demands.
        // The current frontend sends it.

        // Generate a random nonce for wallet signature
        const nonce = generateNonce();
        const expires = Date.now() + 3600000; // 1 hour

        // In a real stateless SIWE setup, you might just return the nonce.
        // If checking session later, you'd store this nonce in a session cookie.
        // For this implementation, we returning it to the client to include in the message.
        // Verification will happen on the login route by checking the structure and validity.
        // To strictly prevent replay attacks, the server should store this nonce and mark it used.
        // For now, we'll verify the signature structure and expiration embedded in the message.

        return NextResponse.json({
            nonce,
            expires,
        });

    } catch (error: any) {
        console.error('Challenge error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate challenge' },
            { status: 500 }
        );
    }
}
