'use client';
import * as React from 'react';
import { Connector, useConnect } from 'wagmi';
import { Button } from '@/components/ui/button';

export function WalletOptions() {
  const { connectors, connect } = useConnect();

  return (
    <div className="flex flex-col gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="w-full"
        >
          {connector.name}
        </Button>
      ))}
    </div>
  );
}
