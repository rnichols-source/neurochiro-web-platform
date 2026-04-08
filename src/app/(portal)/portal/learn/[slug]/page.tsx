import { redirect } from 'next/navigation';
export default async function PortalLearnSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/learn/${slug}`);
}
