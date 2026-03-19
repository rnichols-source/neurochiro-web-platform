'use server'

import { Automations } from "@/lib/automations";

export async function dispatchBroadcastAction(data: any) {
  return Automations.onBroadcastDispatched("super-admin", data);
}

export async function scheduleBroadcastAction(data: any) {
  return Automations.onBroadcastScheduled("super-admin", data);
}
