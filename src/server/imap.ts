import net from 'net';
import { getInboxFromChain, getMailFromChain } from './utils';
import { config } from 'dotenv';

config();

const PORT = 993; // Usually SSL, but we'll use plain TCP for local prototype on 993 or 143

// Simple IMAP State Machine
interface Session {
    socket: net.Socket;
    state: 'NOT_AUTHENTICATED' | 'AUTHENTICATED' | 'SELECTED';
    user?: string;
    selectedMailbox?: string;
}

const server = net.createServer((socket) => {
    const session: Session = {
        socket,
        state: 'NOT_AUTHENTICATED'
    };

    console.log('IMAP Client connected');

    // Send greeting
    socket.write('* OK [CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE LITERAL+] BaseMailer IMAP4rev1 Service Ready\r\n');

    socket.on('data', async (data) => {
        const lines = data.toString().split('\r\n');
        for (const line of lines) {
            if (!line) continue;
            console.log('C:', line);
            await handleCommand(session, line);
        }
    });

    socket.on('end', () => {
        console.log('IMAP Client disconnected');
    });
});

async function handleCommand(session: Session, line: string) {
    const parts = line.split(' ');
    const tag = parts[0];
    const command = parts[1]?.toUpperCase();
    const args = parts.slice(2);

    try {
        switch (command) {
            case 'CAPABILITY':
                session.socket.write(`* CAPABILITY IMAP4rev1 SASL-IR LOGIN-REFERRALS ID ENABLE IDLE LITERAL+\r\n`);
                session.socket.write(`${tag} OK CAPABILITY completed\r\n`);
                break;

            case 'LOGIN':
                // LOGIN username password
                // Args might be quoted
                const username = args[0].replace(/"/g, '');
                // const password = args[1].replace(/"/g, '');

                // Authenticate (Accept all for prototype)
                session.user = username;
                session.state = 'AUTHENTICATED';
                session.socket.write(`${tag} OK [CAPABILITY IMAP4rev1] Logged in\r\n`);
                break;

            case 'SELECT':
                const mailbox = args[0].replace(/"/g, '');
                session.selectedMailbox = mailbox;
                session.state = 'SELECTED';

                // Fetch count from chain
                let exists = 0;
                if (mailbox.toUpperCase() === 'INBOX' && session.user) {
                    const inbox = await getInboxFromChain(session.user);
                    exists = inbox.length;
                }

                session.socket.write(`* ${exists} EXISTS\r\n`);
                session.socket.write(`* 0 RECENT\r\n`);
                session.socket.write(`* OK [UNSEEN 0] Message 0 is first unseen\r\n`);
                session.socket.write(`* OK [UIDVALIDITY ${Date.now()}] UIDs valid\r\n`);
                session.socket.write(`* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)\r\n`);
                session.socket.write(`${tag} OK [READ-WRITE] SELECT completed\r\n`);
                break;

            case 'FETCH':
                // FETCH 1:5 (FLAGS BODY[HEADER.FIELDS (DATE FROM)])
                // Parsing FETCH is complex. We'll handle basic "FETCH 1:* ALL" or similar
                // For prototype, just return nothing or mock
                session.socket.write(`${tag} OK FETCH completed\r\n`);
                break;

            case 'LOGOUT':
                session.socket.write(`* BYE BaseMailer IMAP4rev1 Server logging out\r\n`);
                session.socket.write(`${tag} OK LOGOUT completed\r\n`);
                session.socket.end();
                break;

            case 'NOOP':
                session.socket.write(`${tag} OK NOOP completed\r\n`);
                break;

            default:
                session.socket.write(`${tag} BAD Command not recognized\r\n`);
        }
    } catch (err: any) {
        console.error('IMAP Error:', err);
        session.socket.write(`${tag} NO Error: ${err.message}\r\n`);
    }
}

export function startIMAPServer() {
    server.listen(PORT, () => {
        console.log(`IMAP Server running on port ${PORT}`);
    });
}

if (require.main === module) {
    startIMAPServer();
}
