import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Generate a challenge nonce for wallet signature
        const nonce = `Sign this message to authenticate with DexMail: ${Date.now()}`;
        const expires = Date.now() + 3600000; // 1 hour

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
