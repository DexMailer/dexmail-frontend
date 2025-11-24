import { NextRequest, NextResponse } from 'next/server';
import { uploadJSONToIPFS } from '@/lib/pinata';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await uploadJSONToIPFS(body);
        return NextResponse.json({
            success: true,
            cid: result.IpfsHash,
            timestamp: result.Timestamp
        });
    } catch (error) {
        console.error('IPFS upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload to IPFS' },
            { status: 500 }
        );
    }
}
