/**
 * Checks whether an incoming HTTP request originates from an allowed origin.
 * Protects state-changing endpoints against CSRF attacks while properly handling
 * reverse proxy deployments (Hostinger, Nginx, Cloudflare, OpenLiteSpeed) where
 * the internal request.url might differ in protocol or host (e.g., http://127.0.0.1:3000).
 */
export function isAllowedOrigin(request: Request): boolean {
  // 1. Explicit cross-site requests are rejected
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  // 2. If no origin header is provided, allow (non-browser requests or older clients)
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  // 3. Match against request.url directly
  try {
    const reqUrl = new URL(request.url);
    if (originUrl.origin === reqUrl.origin) {
      return true;
    }
    // Match host/hostname if protocol differs due to proxy SSL termination (http internally, https externally)
    if (originUrl.hostname.toLowerCase() === reqUrl.hostname.toLowerCase()) {
      return true;
    }
  } catch {}

  // 4. Match against Host / X-Forwarded-Host headers
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  if (hostHeader) {
    const hostWithoutPort = hostHeader.split(":")[0].toLowerCase();
    if (originUrl.hostname.toLowerCase() === hostWithoutPort) {
      return true;
    }
  }

  // 5. Match against configured environment URLs
  const envUrls = [process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL].filter(Boolean) as string[];
  for (const envUrl of envUrls) {
    try {
      const parsedEnv = new URL(envUrl);
      if (
        originUrl.origin === parsedEnv.origin ||
        originUrl.hostname.toLowerCase() === parsedEnv.hostname.toLowerCase()
      ) {
        return true;
      }
    } catch {}
  }

  // 6. Trusted domains for this application
  const trustedHosts = [
    "aichoshop.com",
    "www.aichoshop.com",
    "localhost",
    "127.0.0.1",
  ];
  if (trustedHosts.includes(originUrl.hostname.toLowerCase())) {
    return true;
  }

  return false;
}
