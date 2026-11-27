/**
 * Supabase query builders are thenables, not real Promises, so
 * `admin.rpc(...).catch(...)` throws "catch is not a function" before the
 * query even runs. Await inside try/catch instead. Errors come back as null.
 */
export async function settle<T>(call: () => PromiseLike<T>): Promise<T | null> {
  try {
    return await call()
  } catch {
    return null
  }
}
