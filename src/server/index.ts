import { startSMTPServer } from './smtp';
import { startIMAPServer } from './imap';

console.log('Starting BaseMailer Servers...');

startSMTPServer();
startIMAPServer();
