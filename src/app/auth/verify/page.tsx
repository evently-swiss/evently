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

  const user = await prisma.user.findUnique({
    where: { verificationToken: token },
    select: { id: true },
  });

  if (!user) {
    return <InvalidTokenState />;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      verificationToken: null,
    },
  });

  redirect('/login?verified=1');
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
