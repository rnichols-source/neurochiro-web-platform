export interface SeminarCheckout {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  payment_intent?: string | null;
  metadata?: Record<string, string | undefined> | null;
}

export interface SeminarStore {
  markPaid(input: {
    registrationId: string;
    seminarId: string;
    sessionId: string;
    paymentIntent: string | null;
    amountTotal: number | null;
    currency: string | null;
    email: string | null;
  }): Promise<"paid" | "already" | "missing">;
  incrementSold(seminarId: string, registrationId: string): Promise<void>;
  enqueueReminders(registrationId: string, seminarId: string): Promise<void>;
  cancelPending(registrationId: string): Promise<void>;
  markRefunded(paymentIntentId: string): Promise<"refunded" | "already" | "missing">;
  savePackage(input: { sessionId: string; packageId: string; userId: string; email: string | null }): Promise<void>;
  saveFeatured(input: { sessionId: string; seminarId: string; userId: string }): Promise<void>;
  expirePackage(subscriptionId: string): Promise<void>;
}

export function seminarCheckoutType(session: { metadata?: Record<string, string | undefined> | null }): string {
  return session.metadata?.type || "";
}

export function checkoutFromStripeSession(session: {
  id: string;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  payment_intent?: string | { id?: string } | null;
  metadata?: Record<string, string | undefined> | null;
}): SeminarCheckout {
  const paymentIntent = session.payment_intent;
  return {
    id: session.id,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    currency: session.currency,
    customer_email: session.customer_details?.email || session.customer_email || null,
    payment_intent: typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id || null,
    metadata: session.metadata || null,
  };
}

export function isSeminarCheckout(type: string): boolean {
  return type === "seminar_ticket" || type === "seminar_package" || type === "seminar_featured";
}

export async function fulfillSeminarSession(store: SeminarStore, session: SeminarCheckout): Promise<{ result: string }> {
  const type = seminarCheckoutType(session);
  if (!isSeminarCheckout(type)) return { result: "ignored" };
  if (session.payment_status !== "paid") return { result: "skipped" };

  if (type === "seminar_ticket") {
    const registrationId = session.metadata?.registration_id || "";
    const seminarId = session.metadata?.seminar_id || "";
    if (!registrationId) return { result: "missing" };
    const marked = await store.markPaid({
      registrationId,
      seminarId,
      sessionId: session.id,
      paymentIntent: session.payment_intent || null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency || null,
      email: session.customer_email || null,
    });
    if (marked === "already") return { result: "already" };
    if (marked === "missing") return { result: "missing" };
    await store.incrementSold(seminarId, registrationId);
    await store.enqueueReminders(registrationId, seminarId);
    return { result: "paid" };
  }

  if (type === "seminar_package") {
    await store.savePackage({
      sessionId: session.id,
      packageId: session.metadata?.package_id || "",
      userId: session.metadata?.host_user_id || "",
      email: session.customer_email || null,
    });
    return { result: "package" };
  }

  await store.saveFeatured({
    sessionId: session.id,
    seminarId: session.metadata?.seminar_id || "",
    userId: session.metadata?.host_user_id || "",
  });
  return { result: "featured" };
}

export async function releaseSeminarHold(store: SeminarStore, session: SeminarCheckout): Promise<void> {
  if (seminarCheckoutType(session) !== "seminar_ticket") return;
  const registrationId = session.metadata?.registration_id;
  if (!registrationId) return;
  await store.cancelPending(registrationId);
}

export async function refundSeminarCharge(store: SeminarStore, paymentIntentId: string | null): Promise<string> {
  if (!paymentIntentId) return "missing";
  return store.markRefunded(paymentIntentId);
}
