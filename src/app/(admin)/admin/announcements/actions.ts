'use server'

import { Automations } from "@/lib/automations";
import { checkAdminAuth } from '@/lib/admin-auth';

export async function dispatchBroadcastAction(data: any) {
  await checkAdminAuth();
  return Automations.onBroadcastDispatched("super-admin", data);
}

export async function scheduleBroadcastAction(data: any) {
  await checkAdminAuth();
  return Automations.onBroadcastScheduled("super-admin", data);
}
