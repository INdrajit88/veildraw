import type { Metadata } from 'next';
import { VerifyRoute } from '@/components/routes/VerifyRoute';

export const metadata: Metadata = {
  title: 'Verify & Claim',
  description:
    'Check the disclosed winning commitment and claim your VeilDraw prize by proving your ticket in zero knowledge — identity never disclosed.',
};

export default function VerifyPage() {
  return <VerifyRoute />;
}
