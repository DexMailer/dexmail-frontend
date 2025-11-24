
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Archive,
  FileText,
  Inbox,
  Send,
  Trash2,
  Settings,
  HelpCircle,
  Gift,
  Search,
  Users,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Badge } from './ui/badge';
import { UserNav } from './user-nav';
import { Input } from './ui/input';
import { mails } from '@/lib/data';
import { cn } from '@/lib/utils';

export function SidebarNav() {
  const pathname = usePathname();

  const unreadCount = mails.filter(
    (mail) => mail.status === 'inbox' && !mail.read
  ).length;

  const mainLinks = [
    { name: 'Sent', href: '/dashboard/sent', icon: Send },
    { name: 'Drafts', href: '/dashboard/drafts', icon: FileText, count: 9 },
    { name: 'Spam', href: '/dashboard/spam', icon: Users },
    { name: 'Archive', href: '/dashboard/archive', icon: Archive },
    { name: 'Trash', href: '/dashboard/trash', icon: Trash2 },
  ];

  const labelLinks = [
    { name: 'Billing & Payments', color: 'bg-brand-blue', count: 31 },
    { name: 'Project Updates', color: 'bg-orange-500', count: 19 },
    { name: 'Client Inquiries', color: 'bg-red-500', count: 22 },
  ];

  const bottomLinks = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help Center', href: '/dashboard/help', icon: HelpCircle },
  ];

  const subNavItems = [
    {
      name: 'All Messages',
      href: '/dashboard',
    },
    {
      name: 'Already Read',
      href: '/dashboard/read',
    },
    {
      name: 'Unread',
      href: '/dashboard/unread',
      count: unreadCount,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-2 px-2">
      <div className="p-2"></div>
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="bg-background pl-8" />
        </div>
      </div>
      <SidebarMenu className="px-2">
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={pathname.startsWith('/dashboard')}
            tooltip="Inbox"
          >
            <Inbox />
            <span>Inbox</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <div className="ml-7 py-1 flex flex-col gap-1 border-l border-sidebar-border">
          {subNavItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center justify-between  px-3 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                pathname === item.href &&
                  'bg-sidebar-accent font-medium text-sidebar-accent-foreground border-l-2 border-primary'
              )}
            >
              <span className="truncate">{item.name}</span>
              {item.count && item.count > 0 ? (
                <Badge
                  variant="secondary"
                  className="ml-auto group-data-[collapsible=icon]:hidden"
                >
                  {item.count}
                </Badge>
              ) : null}
            </Link>
          ))}
        </div>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={pathname === '/dashboard/claim'}
            tooltip={'Claim'}
          >
            <Link href="/dashboard/claim" className="w-full">
              <Gift />
              <span>Claim</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {mainLinks.map((link) => (
          <SidebarMenuItem key={link.name}>
            <SidebarMenuButton
              asChild
              isActive={pathname === link.href}
              tooltip={link.name}
            >
              <Link href={link.href} className="w-full">
                <link.icon />
                <span>{link.name}</span>
                {link.count && (
                  <Badge
                    variant="secondary"
                    className="ml-auto group-data-[collapsible=icon]:hidden"
                  >
                    {link.count}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <SidebarSeparator />
      <SidebarGroup className="px-2">
        <SidebarGroupLabel>Labels</SidebarGroupLabel>
        <SidebarMenu className="px-2">
          {labelLinks.map((link) => (
            <SidebarMenuItem key={link.name}>
              <SidebarMenuButton tooltip={link.name}>
                <div className={`h-2 w-2 rounded-full ${link.color}`} />
                <span>{link.name}</span>
                {link.count && (
                  <Badge
                    variant="secondary"
                    className="ml-auto group-data-[collapsible=icon]:hidden"
                  >
                    {link.count}
                  </Badge>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <div className="mt-auto">
        <SidebarSeparator />
        <SidebarMenu className="p-2">
          {bottomLinks.map((link) => (
            <SidebarMenuItem key={link.name}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={link.name}
              >
                <Link href={link.href} className="w-full">
                  <link.icon />
                  <span>{link.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator />
        <div className="p-2">
          <UserNav />
        </div>
      </div>
    </div>
  );
}
