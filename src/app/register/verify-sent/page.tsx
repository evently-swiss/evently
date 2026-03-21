import Link from 'next/link';

export default function VerifySentPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-sm text-gray-300">
          We sent a verification link to your inbox. Open it to activate your account.
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
