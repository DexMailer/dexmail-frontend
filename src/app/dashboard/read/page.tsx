
import { MailComponent } from '@/components/mail/mail';
import { mails } from '@/lib/data';

export default function ReadPage() {
  const filteredMails = mails.filter(
    (item) => item.status === 'inbox' && item.read
  );
  return <MailComponent mails={filteredMails} />;
}

    