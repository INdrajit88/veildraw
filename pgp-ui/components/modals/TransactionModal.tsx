'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TransactionStatus } from '@/lib/types';
import { indexerUrl, networkCapitalized } from '@/lib/network';

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

const STAGES = [
  { key: 'preparing', label: 'Preparing transaction' },
  { key: 'submitting', label: 'Submitting to Midnight' },
  { key: 'confirmed', label: 'Confirmed on-chain' },
];

export function TransactionModal({ isOpen, status, action, message, txHash, onClose }: TransactionModalProps) {
  const reduceMotion = useReducedMotion();
  const busy = status === 'Pending' || status === 'Processing';
  const failed = status === 'Failed';
  const confirmed = status === 'Confirmed';

  // Stage index: Pending → 0, Processing → 1, Confirmed → 2
  const activeStage = status === 'Pending' ? 0 : status === 'Processing' ? 1 : confirmed ? 2 : -1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent hideClose={busy} className="max-w-[460px] p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="p-0 space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border',
                    failed
                      ? 'border-rose/25 bg-rose-soft text-rose'
                      : confirmed
                        ? 'border-emerald/25 bg-emerald-soft text-emerald'
                        : 'border-primary/25 bg-primary-soft text-primary-bright',
                  )}
                >
                  {busy ? (
                    <motion.span
                      key={status}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-label="In progress"
                    />
                  ) : (
                    <motion.span
                      key={status}
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      {confirmed ? (
                        <CheckCircle2 className="size-5" aria-hidden />
                      ) : (
                        <AlertCircle className="size-5" aria-hidden />
                      )}
                    </motion.span>
                  )}
                </span>
                <DialogTitle className="truncate text-lg">{action}</DialogTitle>
              </div>
              <Badge variant={statusVariant(status)}>{status}</Badge>
            </div>
            {message && (
              <DialogDescription className="whitespace-pre-line text-xs leading-relaxed text-ink-muted-48">
                {message}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Stage tracker — only while a transaction is in flight */}
          {busy && (
            <div className="mt-5 rounded-lg border border-white/[0.06] bg-[#0b0e16] p-4">
              <ol className="space-y-3">
                {STAGES.map((stage, i) => {
                  const isDone = confirmed || (failed ? false : i < activeStage);
                  const isCurrent = !failed && i === activeStage;
                  return (
                    <li key={stage.key} className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono',
                          isDone
                            ? 'border-emerald/40 bg-emerald-soft text-emerald'
                            : isCurrent
                              ? 'border-primary/50 bg-primary-soft text-primary-bright'
                              : 'border-white/10 bg-white/[0.03] text-ink-muted-48',
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="size-3" aria-hidden />
                        ) : isCurrent ? (
                          <span className="size-2 animate-pulse-soft rounded-full bg-primary-bright" aria-hidden />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          'font-mono text-xs',
                          isCurrent ? 'text-white' : isDone ? 'text-ink-muted-80' : 'text-ink-muted-48/60',
                        )}
                      >
                        {stage.label}
                        {isCurrent && <span className="text-primary-bright">…</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {/* Indeterminate progress */}
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.05]" aria-hidden>
                <div className="h-full w-2/5 animate-indeterminate rounded-full bg-primary/70" />
              </div>
            </div>
          )}

          {txHash && (
            <div className="data-block mt-5 space-y-1.5 p-4">
              <p className="text-ink-muted-48">{'// Transaction hash'}</p>
              <p className="break-all text-primary-bright">{txHash}</p>
              <a
                href={indexerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 pt-1 text-xs text-ink-muted-80 underline-offset-4 hover:text-white hover:underline"
              >
                View in {networkCapitalized} indexer
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant={failed ? 'default' : 'secondary'} onClick={onClose} disabled={busy} className="min-w-28">
              {failed ? 'Dismiss' : 'Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
