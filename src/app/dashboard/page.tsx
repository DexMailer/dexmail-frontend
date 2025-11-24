
import { MailComponent } from '@/components/mail/mail';
import { mails } from '@/lib/data';

export default function DashboardPage() {
  return <MailComponent mails={mails} />;
}

    