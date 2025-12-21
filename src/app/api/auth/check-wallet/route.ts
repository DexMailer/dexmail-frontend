import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ walletAddress: address.toLowerCase() });

        return NextResponse.json({
            exists: !!user,
            email: user ? user.email : null
        });

    } catch (error) {
        console.error('Check wallet error:', error);
        return NextResponse.json({ error: 'Failed to check wallet' }, { status: 500 });
    }
}
