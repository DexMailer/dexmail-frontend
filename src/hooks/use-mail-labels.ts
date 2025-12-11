import { useMail } from '@/contexts/mail-context';
import { useMemo } from 'react';

export interface LabelCount {
    name: string;
    count: number;
    color?: string;
}

const LABEL_COLORS: Record<string, string> = {
    'Billing & Payments': 'bg-brand-blue',
    'Project Updates': 'bg-orange-500',
    'Client Inquiries': 'bg-red-500',
};

const DEFAULT_COLOR = 'bg-gray-500';

export function useMailLabels(): LabelCount[] {
    const { mails } = useMail();

    return useMemo(() => {
        const labelMap = new Map<string, number>();

        mails.forEach((mail) => {
            if (mail.labels && Array.isArray(mail.labels)) {
                mail.labels.forEach((label) => {
                    labelMap.set(label, (labelMap.get(label) || 0) + 1);
                });
            }
        });

        return Array.from(labelMap.entries()).map(([name, count]) => ({
            name,
            count,
            color: LABEL_COLORS[name] || DEFAULT_COLOR,
        }));
    }, [mails]);
}
