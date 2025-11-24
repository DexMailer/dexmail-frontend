import Image from 'next/image';
import Link from 'next/link';

export function AppLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <Image 
        src="/logo.png" 
        alt="DexMail logo" 
        width={40} 
        height={40} 
        className="rounded-lg"
        priority
        unoptimized
      />
      <span className="text-xl font-bold">DexMail</span>
    </Link>
  );
}
