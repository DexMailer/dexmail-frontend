
'use client';

import { cn } from '@/lib/utils';

import {
  Archive,
  ArrowLeft,
  Clock,
  Folder,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash,
  Send,
  Mail as MailIcon,
  MailOpen,
  AlertCircle,
} from 'lucide-react';
import { format, isToday } from 'date-fns';

import type { Mail } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useIsMobile } from '@/hooks/use-mobile';
import { Textarea } from '../ui/textarea';
import { useMail } from '@/contexts/mail-context';
import { useEffect, useState } from 'react';
import { ComposeDialog } from './compose-dialog';
import { useToast } from '@/hooks/use-toast';
import { mailService } from '@/lib/mail-service';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface MailDisplayProps {
  mail: Mail | null;
  onBack?: () => void;
  onNavigateToMail?: (mailId: string) => void;
}

export function MailDisplay({ mail, onBack, onNavigateToMail }: MailDisplayProps) {
  const isMobile = useIsMobile();
  const { markAsRead, markAsUnread, moveToArchive, moveToSpam, moveToTrash, restoreFromTrash, getEmailStatus } = useMail();
  const { toast } = useToast();
  const { user } = useAuth();
  const [replyBody, setReplyBody] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  if (!mail) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="text-lg font-semibold mb-2">No message selected</div>
        <p className="text-sm">Choose a message from the list to view it here</p>
      </div>
    );
  }

  const emailStatus = getEmailStatus(mail.id);

  const handleMarkAsRead = () => {
    if (emailStatus.read) {
      markAsUnread(mail.id);
    } else {
      markAsRead(mail.id);
    }
  };

  const handleArchive = () => {
    moveToArchive(mail.id);
    if (onBack) onBack();
  };

  const handleSpam = () => {
    moveToSpam(mail.id);
    if (onBack) onBack();
  };

  const handleDelete = () => {
    moveToTrash(mail.id);
    if (onBack) onBack();
  };

  // Automatically mark as read when email is opened
  useEffect(() => {
    if (mail && !emailStatus.read) {
      // Mark as read after a short delay to ensure user actually viewed it
      const timer = setTimeout(() => {
        markAsRead(mail.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mail?.id]);

  const userAvatar = PlaceHolderImages.find(
    (img: any) => img.id === 'user-avatar-1'
  );

  const mailDate = new Date(mail.date);

  const handleReply = async () => {
    if (!replyBody.trim()) {
      toast({
        title: "Empty Reply",
        description: "Please type a message to reply.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please log in to reply.",
        variant: "destructive"
      });
      return;
    }

    setIsSendingReply(true);
    try {
      const fullBody = `${replyBody}\n\nOn ${format(mailDate, "PPP p")}, ${mail.name} wrote:\n> ${mail.body.replace(/\n/g, '\n> ')}`;

      await mailService.sendEmail({
        from: user.email,
        to: [mail.email], // Reply to sender
        subject: mail.subject.startsWith('Re:') ? mail.subject : `Re: ${mail.subject}`,
        body: fullBody,
        inReplyTo: mail.id
      });

      toast({
        title: "Reply Sent",
        description: "Your reply has been sent successfully."
      });

      setReplyBody(''); // Clear textarea
    } catch (error) {
      console.error('Failed to send reply:', error);
      toast({
        title: "Error Sending Reply",
        description: "Failed to send your reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  const getForwardData = () => {
    return {
      to: '',
      subject: mail.subject.startsWith('Fwd:') ? mail.subject : `Fwd: ${mail.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${mail.name} <${mail.email}>\nDate: ${format(mailDate, "PPP p")}\nSubject: ${mail.subject}\nTo: Me\n\n${mail.body}`
    };
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2 md:p-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex items-center gap-1 md:gap-2">
          <TooltipProvider delayDuration={0}>
            {emailStatus.deleted ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => {
                    restoreFromTrash(mail.id);
                    if (onBack) onBack();
                  }}>
                    <Reply className="h-4 w-4" />
                    <span className="sr-only">Restore</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Restore from Trash</TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleMarkAsRead}>
                      {emailStatus.read ? <MailOpen className="h-4 w-4" /> : <MailIcon className="h-4 w-4" />}
                      <span className="sr-only">{emailStatus.read ? 'Mark as Unread' : 'Mark as Read'}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{emailStatus.read ? 'Mark as Unread' : 'Mark as Read'}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleArchive}>
                      <Archive className="h-4 w-4" />
                      <span className="sr-only">Archive</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Archive</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleSpam}>
                      <AlertCircle className="h-4 w-4" />
                      <span className="sr-only">Mark as Spam</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mark as Spam</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleDelete}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" disabled={!mail}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">More</span>
          </Button>
        </div>
      </div>
      <Separator />
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="flex items-start p-4">
          <div className="flex w-full items-start gap-4 text-sm">
            <Avatar>
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
            <div className="grid gap-1">
              <div className="font-semibold">{mail.name}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">
                Reply-to: {mail.email}
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {format(mailDate, "MMM d, yyyy, h:mm a")}
            </div>
          </div>
        </div>
        <div className="p-4 pt-0">
          <h1 className="text-2xl font-bold">{mail.subject}</h1>
          {mail.inReplyTo && (
            <div className="mt-2">
              <Button
                variant="link"
                className="p-0 h-auto text-muted-foreground text-xs"
                onClick={() => onNavigateToMail?.(mail.inReplyTo!)}
              >
                In reply to a message
              </Button>
            </div>
          )}
        </div>

        {mail.hasCryptoTransfer && (
          <div className="mx-4 mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
            {(() => {
              // Check if this is a direct transfer or claimable transfer
              const isDirectTransfer = mail.body.includes('✅ Assets have been transferred directly');
              const claimCodeMatch = mail.body.match(/Your Claim Code: (\d{3} \d{3})|claim code: (\d{6})/i);
              const claimCode = claimCodeMatch ? (claimCodeMatch[1]?.replace(' ', '') || claimCodeMatch[2]) : '';

              if (isDirectTransfer) {
                // Direct transfer UI
                return (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary">Crypto Assets Received</h4>
                      <p className="text-xs text-muted-foreground">
                        Assets have been transferred directly to your wallet. Check your dashboard to view them.
                      </p>
                    </div>
                    <Button size="sm" onClick={() => window.location.href = '/dashboard'}>
                      View Dashboard
                    </Button>
                  </div>
                );
              } else if (claimCode) {
                // Claimable transfer UI
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      <div>
                        <h4 className="font-semibold text-primary">Crypto Assets Attached</h4>
                        <p className="text-xs text-muted-foreground">
                          This email contains crypto assets waiting to be claimed.
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => {
                      window.location.href = `/dashboard/claim?code=${claimCode}`;
                    }}>
                      Claim Assets
                    </Button>
                  </div>
                );
              } else {
                // Fallback for crypto transfers without clear indicators
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      <div>
                        <h4 className="font-semibold text-primary">Crypto Assets Attached</h4>
                        <p className="text-xs text-muted-foreground">This email contains crypto assets.</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => window.location.href = '/dashboard/claim'}>
                      View Details
                    </Button>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {mail && (
          <div className="flex-1 p-4 pt-0 text-sm space-y-4">
            {(() => {
              // Parsing Logic
              const lines = mail.body.split('\n');
              const segments: { type: 'text' | 'quote'; content: string[] }[] = [];
              let currentSegment: { type: 'text' | 'quote'; content: string[] } = { type: 'text', content: [] };

              lines.forEach((line) => {
                const isQuote = line.trim().startsWith('>') || line.trim().startsWith('On ') && line.includes('wrote:');

                // Heuristic: "On ... wrote:" often starts a quote block even without >
                // But for simplicity and safety, let's mainly rely on >.
                // If we switch types, push current and start new.
                // Exception: If we are in 'text' mode and see a quote indicator, switch.
                // If in 'quote' mode, we tend to stay in quote mode unless it's clearly a new disjoint block? 
                // Actually, standard email replies are usually:
                // New Text
                // > Old Text
                // 
                // So we just check if line starts with >

                const lineIsQuote = line.trim().startsWith('>');

                if (lineIsQuote) {
                  if (currentSegment.type !== 'quote') {
                    if (currentSegment.content.length > 0) segments.push(currentSegment);
                    currentSegment = { type: 'quote', content: [] };
                  }
                  currentSegment.content.push(line.replace(/^>\s?/, '')); // Remove the > marker
                } else {
                  // Check for "On ... wrote:" header which usually precedes quotes
                  if (line.trim().startsWith('On ') && line.endsWith('wrote:')) {
                    if (currentSegment.type !== 'quote') {
                      if (currentSegment.content.length > 0) segments.push(currentSegment);
                      currentSegment = { type: 'quote', content: [] };
                    }
                    currentSegment.content.push(line);
                  } else {
                    if (currentSegment.type === 'quote') {
                      // If we were in a quote but find a blank line, it might just be spacing in the quote.
                      // But if it's text, it's ambiguous. Standard clients indent everything.
                      // Let's assume if it doesn't start with >, it's text, UNLESS the previous line was a quote and this is empty.
                      if (line.trim() === '') {
                        currentSegment.content.push(line);
                      } else {
                        // Break out of quote
                        if (currentSegment.content.length > 0) segments.push(currentSegment);
                        currentSegment = { type: 'text', content: [] };
                        currentSegment.content.push(line);
                      }
                    } else {
                      currentSegment.content.push(line);
                    }
                  }
                }
              });

              if (currentSegment.content.length > 0) segments.push(currentSegment);

              // Reverse segments to show oldest (history) first, then newest (latest reply)
              return segments.reverse().map((segment, index) => (
                <div
                  key={index}
                  className={cn(
                    "whitespace-pre-wrap rounded-lg p-3",
                    segment.type === 'quote'
                      ? "bg-muted/50 text-muted-foreground border-l-4 border-muted italic text-xs"
                      : "bg-card text-card-foreground border shadow-sm"
                  )}
                >
                  {segment.content.join('\n').trim()}
                </div>
              ));
            })()}
          </div>
        )}
        <Separator className="mt-auto" />
        <div className="p-4">
          <div className="grid gap-4">
            <Textarea
              className="p-4"
              placeholder={`Reply to ${mail.name}...`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleReply} disabled={isSendingReply}>
                {isSendingReply ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
              <ComposeDialog initialData={getForwardData()}>
                <Button size="sm" variant="ghost">
                  <Forward className="mr-2 h-4 w-4" />
                  Forward
                </Button>
              </ComposeDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

