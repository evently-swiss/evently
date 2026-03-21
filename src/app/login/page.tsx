import LoginForm from './login-form';

type LoginPageProps = {
  searchParams: Promise<{ verified?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { verified } = await searchParams;
  return <LoginForm emailVerified={verified === '1'} />;
}
