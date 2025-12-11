import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CidMapping from '@/models/CidMapping';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cidHash = searchParams.get('cidHash');

        if (!cidHash) {
            return NextResponse.json(
                { error: 'cidHash query parameter is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const mapping = await CidMapping.findOne({ cidHash });

        if (!mapping) {
            console.log('[API] CID mapping not found:', cidHash);
            return NextResponse.json(
                { error: 'CID mapping not found' },
                { status: 404 }
            );
        }

        console.log('[API] Retrieved CID mapping:', { cidHash, fullCid: mapping.fullCid });

        return NextResponse.json({
            success: true,
            fullCid: mapping.fullCid
        });
    } catch (error: any) {
        console.error('[API] Error retrieving CID mapping:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve CID mapping', details: error.message },
            { status: 500 }
        );
    }
}
