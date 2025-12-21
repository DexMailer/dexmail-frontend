import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { sanitizeInput } from '@/lib/validation';

const API_KEY = process.env.SENDGRID_API_KEY;

if (API_KEY) {
    sgMail.setApiKey(API_KEY);
} else {
    console.warn('SENDGRID_API_KEY is not set');
}

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { to, from, subject, text, html, replyTo } = body;

        if (!to || !from || !subject || (!text && !html)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Basic sanity check to prevent empty emails or spammy looking things
        if (typeof subject !== 'string' || subject.trim().length === 0) {
            return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
        }

        const fromEmail = typeof from === 'object' && from !== null ? from.email : from;

        // Sanitize potentially rendered fields
        const safeSubject = sanitizeInput(subject);
        // HTML is expected to be HTML, but we should be careful. 
        // For now, assume the client cleans it or we trust it to some degree if it's our own editor.
        // If this is public facing, we'd need a robust HTML sanitizer like 'dompurify' (server side version like jsdom or isomorphic-dompurify).
        // Since we didn't add that dep, we will assume basic structure is valid but maybe check length.

        const msg = {
            to,
            from,
            subject: safeSubject,
            text,
            html: html || text,
            replyTo: replyTo,
            headers: {
                'Sender': fromEmail,
                'X-Original-Sender': fromEmail,
                'Precedence': 'normal'
            },
            trackingSettings: {
                clickTracking: {
                    enable: false,
                    enableText: false
                },
                openTracking: {
                    enable: false
                },
                subscriptionTracking: {
                    enable: false
                }
            }
        };

        await sgMail.send(msg);
        console.log(`[SendGrid] Email sent to ${to}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[SendGrid] Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}
