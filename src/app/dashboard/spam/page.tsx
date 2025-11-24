
import { MailComponent } from '@/components/mail/mail';
import { mails } from '@/lib/data';

export default function SpamPage() {
  const filteredMails = mails.filter((item) => item.status === 'spam');
  return <MailComponent mails={filteredMails} />;
}

    