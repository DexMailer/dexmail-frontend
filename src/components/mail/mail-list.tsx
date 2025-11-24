
'use client';

import { ComponentProps, useState } from 'react';
import type { Mail } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { format, isToday } from 'date-fns';

interface MailListProps {
  items: Mail[];
  onSelectMail: (mail: Mail) => void;
  selectedMailId?: string | null;
  selectedMailIds: string[];
  onToggleMailSelection: (mailId: string) => void;
}

function MailItem({
  mail,
  onSelectMail,
  selectedMailId,
  isSelected,
  onToggleSelection,
  anyMailSelected,
}: {
  mail: Mail;
  onSelectMail: (mail: Mail) => void;
  selectedMailId?: string | null;
  isSelected: boolean;
  onToggleSelection: (mailId: string) => void;
  anyMailSelected: boolean;
}) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === mail.id);
  const mailDate = new Date(mail.date);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'group/mail-item flex items-start gap-3 p-4 text-left text-sm transition-colors border-b cursor-pointer',
        'hover:bg-accent',
        selectedMailId === mail.id && 'bg-primary/10',
        !mail.read && 'bg-blue-500/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelectMail(mail)}
    >
      <div className="flex items-center gap-4">
        {isHovered || isSelected || anyMailSelected ? (
          <Checkbox
            id={`select-${mail.id}`}
            aria-label={`Select mail from ${mail.name}`}
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(mail.id)}
            onClick={(e) => e.stopPropagation()}
            className="transition-opacity"
          />
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarImage
              alt={mail.name}
              src={userAvatar?.imageUrl}
              data-ai-hint={userAvatar?.imageHint}
            />
            <AvatarFallback>
              {mail.name
                .split(' ')
                .map((chunk) => chunk[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
             {!mail.read && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            )}
            <div className={cn("font-semibold", !mail.read && "font-bold")}>{mail.name}</div>
          </div>
          <div
            className={cn(
              'ml-auto text-xs',
              selectedMailId === mail.id
                ? 'text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {isToday(mailDate)
              ? format(mailDate, 'p')
              : format(mailDate, 'MMM d')}
          </div>
        </div>
        <div className={cn("text-xs font-medium", !mail.read && "font-bold")}>{mail.subject}</div>
        <div className="line-clamp-1 text-xs text-muted-foreground">
          {mail.text.substring(0, 100)}
        </div>
      </div>
    </div>
  );
}

export function MailList({
  items,
  onSelectMail,
  selectedMailId,
  selectedMailIds,
  onToggleMailSelection,
}: MailListProps) {
  const anyMailSelected = selectedMailIds.length > 0;
  return (
    <div className="flex h-full flex-col md:border-r">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-px">
          {items.map((item) => (
            <MailItem
              key={item.id}
              mail={item}
              onSelectMail={onSelectMail}
              selectedMailId={selectedMailId}
              isSelected={selectedMailIds.includes(item.id)}
              onToggleSelection={onToggleMailSelection}
              anyMailSelected={anyMailSelected}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
