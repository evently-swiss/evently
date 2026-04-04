import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

type VerifyPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidTokenState />;
  }

  let status: 'success' | 'invalid' | 'error' = 'error';

  try {
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      select: { id: true },
    });

    if (!user) {
      status = 'invalid';
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          verificationToken: null,
        },
      });
      status = 'success';
    }
  } catch (error) {
    console.error('[verify-page] Failed to verify email token:', error);
    status = 'error';
  }

  if (status === 'success') {
    redirect('/login?verified=1');
  }

  if (status === 'invalid') {
    return <InvalidTokenState />;
  }

  return <VerificationErrorState />;
}

function VerificationErrorState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm text-gray-300">
          We could not verify your email at this time. Please try again later or contact support.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Back to sign in
        </Link>
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
          This verification link is no longer valid. Please request a new one.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
