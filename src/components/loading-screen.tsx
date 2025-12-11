'use client';

import Image from 'next/image';

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="relative flex flex-col items-center gap-4">
        <Image
          src="/logo.png"
          alt="DexMail Logo"
          width={128}
          height={128}
          className="h-32 w-32 rounded-2xl"
          priority
          unoptimized
        />
        <div className="glitch text-4xl font-bold" data-text="DexMail">
          DexMail
        </div>
      </div>
    </div>
  );
}
