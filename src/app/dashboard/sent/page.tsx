
import { MailComponent } from '@/components/mail/mail';
import { mails } from '@/lib/data';

export default function SentPage() {
  return <MailComponent mails={[]} category="sent" />;
}

