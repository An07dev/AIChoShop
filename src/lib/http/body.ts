export class RequestBodyError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export async function readLimitedJson(request: Request, maxBytes: number): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestBodyError("BODY_TOO_LARGE", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError("EMPTY_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new RequestBodyError("BODY_TOO_LARGE", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try {
    const buffer = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer));
  } catch { throw new RequestBodyError("INVALID_JSON"); }
}
