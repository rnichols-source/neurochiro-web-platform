import { NextRequest } from "next/server";
import { searchDirectory } from "@/lib/directory/search";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  return searchDirectory(request);
}
