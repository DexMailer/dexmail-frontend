import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CidMapping from '@/models/CidMapping';

export async function POST(request: NextRequest) {
    try {
        const { cidHash, fullCid } = await request.json();

        if (!cidHash || !fullCid) {
            return NextResponse.json(
                { error: 'cidHash and fullCid are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Use upsert to avoid duplicates
        const mapping = await CidMapping.findOneAndUpdate(
            { cidHash },
            { cidHash, fullCid },
            { upsert: true, new: true }
        );

        console.log('[API] Stored CID mapping:', { cidHash, fullCid });

        return NextResponse.json({
            success: true,
            mapping: {
                cidHash: mapping.cidHash,
                fullCid: mapping.fullCid
            }
        });
    } catch (error: any) {
        console.error('[API] Error storing CID mapping:', error);
        return NextResponse.json(
            { error: 'Failed to store CID mapping', details: error.message },
            { status: 500 }
        );
    }
}
