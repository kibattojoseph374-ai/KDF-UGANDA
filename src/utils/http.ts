export async function safeReadJson<T = Record<string, unknown>>(
  res: Response
): Promise<T & { error?: string }> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return (await res.json()) as T & { error?: string };
    } catch {
      return { error: `Server returned invalid JSON (HTTP ${res.status}).` } as T & { error?: string };
    }
  }
  const text = await res.text().catch(() => '');
  return {
    error: text && text.length < 200 ? text : `Request failed with status HTTP ${res.status}.`,
  } as T & { error?: string };
}
