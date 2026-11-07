// The signup form is a client page. This refreshes its server render hourly
// so the Dec 1 US price is in the first HTML, not only after hydration.
export const revalidate = 3600;

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
