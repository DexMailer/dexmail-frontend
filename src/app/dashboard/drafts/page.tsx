
import { MailComponent } from '@/components/mail/mail';
import { mails } from '@/lib/data';

export default function DraftsPage() {
  const filteredMails = mails.filter((item) => item.status === 'draft');
  return <MailComponent mails={filteredMails} />;
}

    