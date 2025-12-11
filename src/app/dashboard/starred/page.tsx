
import { MailComponent } from '@/components/mail/mail';
import { mails } from '@/lib/data';

export default function StarredPage() {
  const filteredMails = mails.filter((item) => item.labels.includes('starred'));
  return <MailComponent mails={filteredMails} />;
}
