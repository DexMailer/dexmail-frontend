import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ valid: false, reason: 'Invalid format' });
        }

        const domain = email.split('@')[1];

        try {
            const addresses = await resolveMx(domain);
            if (addresses && addresses.length > 0) {
                return NextResponse.json({ valid: true });
            } else {
                return NextResponse.json({ valid: false, reason: 'No mail server found for this domain' });
            }
        } catch (error: any) {
            // specific error codes for domain not found
            if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
                return NextResponse.json({ valid: false, reason: 'Domain does not exist or has no mail records' });
            }
            throw error;
        }

    } catch (error) {
        console.error('Domain validation error:', error);
        return NextResponse.json({ error: 'Failed to validate domain' }, { status: 500 });
    }
}
