'use client';

import React, { useEffect, useState } from 'react';
import { MailList } from './mail-list';
import { MailDisplay } from './mail-display';
import type { Mail } from '@/lib/data';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Separator } from '../ui/separator';
import {
  Archive,
  Folder,
  Trash,
  MoreVertical,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { ComposeDialog } from './compose-dialog';
import { Edit } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import Link from 'next/link';
import { mailService } from '@/lib/mail-service';
import { useAccount } from 'wagmi';
import { useAuth } from '@/contexts/auth-context';

function Header() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">All Messages</p>
      </div>

      <div className="flex items-center gap-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Folder className="h-4 w-4" />
                <span className="sr-only">Move to folder</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to folder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">More</span>
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <ComposeDialog>
          <Button>
            <Edit className="mr-2 h-4 w-4" /> Write Message
          </Button>
        </ComposeDialog>
      </div>
    </div>
  );
}

function MobileHeader() {
  const userAvatar = PlaceHolderImages.find(
    (img) => img.id === 'user-avatar-1'
  );
  return (
    <header className="fixed top-0 z-10 flex h-16 items-center justify-between gap-3 border-b bg-background px-4 w-full">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="bg-muted pl-8 h-10 rounded-full" />
      </div>
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage
                  src={userAvatar?.imageUrl}
                  alt="User Avatar"
                  data-ai-hint={userAvatar?.imageHint}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Judha Maygustya</p>
                <p className="text-xs leading-none text-muted-foreground">
                  judha.design@gmail.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/login">Log out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function MailComponent({ mails: initialMails }: { mails: Mail[] }) {
  const [mails, setMails] = useState<Mail[]>(initialMails);
  const [selectedMailId, setSelectedMailId] = React.useState<string | null>(null);
  const [selectedMailIds, setSelectedMailIds] = React.useState<string[]>([]);
  const [activeTab, setActiveTab] = React.useState<'inbox' | 'sent'>('inbox');
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { address, isConnected } = useAccount();
  const { user } = useAuth();

  useEffect(() => {
    const fetchMails = async () => {
      // Only fetch if user is authenticated and has an email
      if (!isConnected || !address || !user?.email) return;

      setIsLoading(true);
      try {
        // Use user's email instead of wallet address
        const fetchedMails = await mailService.getInbox(user.email);

        const mappedMails: Mail[] = fetchedMails.map(m => ({
          id: m.messageId,
          name: m.from, // Simplify for now
          email: m.from,
          subject: m.subject,
          text: (m.body || '').substring(0, 100) + '...',
          date: m.timestamp,
          read: false,
          labels: [],
          status: 'inbox',
          body: m.body || '',
          hasCryptoTransfer: m.hasCryptoTransfer
        }));

        // Merge with initial mails or replace? 
        // For prototype, let's prepend fetched mails to initial mock mails
        setMails([...mappedMails, ...initialMails]);
      } catch (error) {
        console.error('Failed to fetch mails:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'inbox') {
      fetchMails();
    }
  }, [isConnected, address, user?.email, activeTab, initialMails]);

  const selectedMail = mails.find((item) => item.id === selectedMailId);

  const filteredMails = mails.filter((mail) => {
    if (activeTab === 'sent') return mail.status === 'sent';
    return mail.status === 'inbox';
  });

  const handleSelectMail = (mail: Mail) => {
    setSelectedMailId(mail.id);
  };

  const handleToggleMailSelection = (mailId: string) => {
    setSelectedMailIds((prev) =>
      prev.includes(mailId)
        ? prev.filter((id) => id !== mailId)
        : [...prev, mailId]
    );
  };

  const handleBack = () => {
    setSelectedMailId(null);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full w-full bg-background">
        <MobileHeader />
        <div className="mt-16 flex-1 flex flex-col">
          {!selectedMailId && (
            <div className="p-4">
              <div className="flex items-baseline justify-between">
                <h1 className="text-4xl font-bold">Inbox</h1>
              </div>
              <div className="mt-4 flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted p-1">
                  <Button
                    onClick={() => setActiveTab('inbox')}
                    variant={activeTab === 'inbox' ? 'secondary' : 'ghost'}
                    className={cn(
                      'rounded-full',
                      activeTab === 'inbox' && 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    All Mail
                  </Button>
                  <Button
                    onClick={() => setActiveTab('sent')}
                    variant={activeTab === 'sent' ? 'secondary' : 'ghost'}
                    className={cn(
                      'rounded-full',
                      activeTab === 'sent' && 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    All Sent
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 w-full">
            {isLoading && !selectedMailId ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : selectedMail ? (
              <MailDisplay mail={selectedMail} onBack={handleBack} />
            ) : (
              <MailList
                items={filteredMails}
                onSelectMail={handleSelectMail}
                selectedMailId={selectedMailId}
                selectedMailIds={selectedMailIds}
                onToggleMailSelection={handleToggleMailSelection}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <Header />
      <div className="flex-1 w-full">
        {isLoading && !selectedMail ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
        ) : selectedMail ? (
          <MailDisplay mail={selectedMail} onBack={handleBack} />
        ) : (
          <MailList
            items={filteredMails}
            onSelectMail={handleSelectMail}
            selectedMailId={selectedMailId}
            selectedMailIds={selectedMailIds}
            onToggleMailSelection={handleToggleMailSelection}
          />
        )}
      </div>
    </div>
  );
}
