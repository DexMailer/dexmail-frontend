import { MailComponent } from '@/components/mail/mail';

export default function LabelPage({ params }: { params: { label: string } }) {
    return <MailComponent mails={[]} label={params.label} />;
}
