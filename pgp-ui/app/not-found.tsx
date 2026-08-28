import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="ambient flex min-h-[80vh] items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-primary/25 bg-primary-soft text-primary-bright">
          <Compass className="size-5" aria-hidden />
        </span>
        <div className="space-y-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary-bright">404 — Not found</p>
          <h1 className="t-display-lg">This route doesn&rsquo;t exist.</h1>
          <p className="t-body">
            The page you&rsquo;re looking for isn&rsquo;t part of the VeilDraw protocol. Head back to the home page or
            open a live giveaway.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button variant="default">Back to home</Button>
          </Link>
          <Link href="/giveaways">
            <Button variant="secondary">Open giveaways</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
