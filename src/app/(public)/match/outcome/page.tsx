import { consumeOutcomeLink } from '@/lib/match/prompts';

export const dynamic = 'force-dynamic';

export default async function OutcomePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const message = token ? await consumeOutcomeLink(token) : 'This link is not valid.';
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-3xl font-bold text-[#14212e]">ChiroMatch</h1>
      <p className="mt-4 text-base text-[#14212e]">{message}</p>
    </main>
  );
}
