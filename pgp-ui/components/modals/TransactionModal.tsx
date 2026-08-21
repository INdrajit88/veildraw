'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TransactionStatus } from '@/lib/types';

interface TransactionModalProps {
  isOpen: boolean;
  status: TransactionStatus;
  action: string;
  message?: string;
  txHash?: string;
  onClose: () => void;
}

function statusVariant(status: TransactionStatus): 'open' | 'pending' | 'completed' | 'error' {
  switch (status) {
    case 'Confirmed':
      return 'completed';
    case 'Failed':
      return 'error';
    case 'Pending':
    case 'Processing':
      return 'pending';
    default:
      return 'open';
  }
}

export function TransactionModal({ isOpen, status, action, message, txHash, onClose }: TransactionModalProps) {
  const busy = status === 'Pending' || status === 'Processing';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideClose={busy}>
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>{action}</DialogTitle>
            <Badge variant={statusVariant(status)}>{status}</Badge>
          </div>
          <DialogDescription className="mt-2">{message}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2">
          {busy && (
            <div className="flex items-center gap-3 rounded-sm bg-parchment px-4 py-3">
              <span className="size-4 animate-spin rounded-full border-2 border-ink-muted-48 border-t-transparent" />
              <span className="t-caption text-ink-muted-80">Generating ZK proof — this can take a moment.</span>
            </div>
          )}

          {txHash && (
            <div className="data-block p-4">
              <p className="text-ink-muted-48">{'// txHash'}</p>
              <p className="mt-1 break-all text-primary-on-dark">{txHash}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 pt-4">
          <Button variant={status === 'Failed' ? 'destructive' : 'default'} onClick={onClose}>
            {status === 'Failed' ? 'Dismiss' : 'Done'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
