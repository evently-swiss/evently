import Link from 'next/link';
import prisma from '@/lib/prisma';
import ResetPasswordForm from './reset-password-form';

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidTokenState />;
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, usedAt: true, expiresAt: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return <InvalidTokenState />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-400">Enter a new password for your account.</p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

function InvalidTokenState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <h1 className="text-2xl font-bold">Invalid or expired link</h1>
        <p className="mt-3 text-sm text-gray-300">
          This password reset link is no longer valid. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Request new link
        </Link>
      </div>
    </div>
  );
}
