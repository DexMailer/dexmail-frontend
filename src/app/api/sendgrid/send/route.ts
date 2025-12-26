import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { sanitizeInput } from '@/lib/validation';

const API_KEY = process.env.SENDGRID_API_KEY;

if (API_KEY) {
    sgMail.setApiKey(API_KEY);
} else {
    console.warn('SENDGRID_API_KEY is not set');
}

interface EmailAttachment {
    name: string;
    size: number;
    type: string;
    cid: string;
}

// Fetch file from IPFS and convert to base64
async function fetchAttachmentFromIPFS(cid: string): Promise<string | null> {
    try {
        const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
        const response = await fetch(gatewayUrl);
        if (!response.ok) return null;
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return base64;
    } catch (error) {
        console.error(`[SendGrid] Failed to fetch attachment from IPFS: ${cid}`, error);
        return null;
    }
}

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { to, from, subject, text, html, replyTo, attachments } = body;

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

        // Process attachments if present
        const sgAttachments: { content: string; filename: string; type: string; disposition: string }[] = [];
        
        if (attachments && Array.isArray(attachments)) {
            for (const att of attachments as EmailAttachment[]) {
                const content = await fetchAttachmentFromIPFS(att.cid);
                if (content) {
                    sgAttachments.push({
                        content,
                        filename: att.name,
                        type: att.type,
                        disposition: 'attachment'
                    });
                }
            }
            console.log(`[SendGrid] Processed ${sgAttachments.length} attachments`);
        }

        const msg: sgMail.MailDataRequired = {
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
            },
            ...(sgAttachments.length > 0 && { attachments: sgAttachments })
        };

        await sgMail.send(msg);
        console.log(`[SendGrid] Email sent to ${to}${sgAttachments.length > 0 ? ` with ${sgAttachments.length} attachment(s)` : ''}`);

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
