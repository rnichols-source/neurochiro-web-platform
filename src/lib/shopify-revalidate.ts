import { revalidatePath, revalidateTag } from "next/cache";

const HANDLE = /^[a-z0-9-]{1,120}$/;

export function revalidateShopifyCache(handles: string[] = []): void {
  revalidateTag("shopify", { expire: 0 });
  revalidatePath("/store");
  for (const handle of handles) {
    if (HANDLE.test(handle)) revalidatePath(`/store/${handle}`);
  }
}
