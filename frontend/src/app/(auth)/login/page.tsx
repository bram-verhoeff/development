import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  // Alleen bekende codes uit de URL tonen
  return <LoginForm initialError={error === "link_invalid" ? error : undefined} />;
}
