import LoginForm from './login-form';

type LoginPageProps = {
  searchParams: Promise<{ verified?: string; reset?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { verified, reset } = await searchParams;
  return <LoginForm emailVerified={verified === '1'} passwordReset={reset === '1'} />;
}
