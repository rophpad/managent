const DEFAULT_API_BASE_URLS = [
  "http://127.0.0.1:8081",
  "http://localhost:8081",
  "http://127.0.0.1:8080",
  "http://localhost:8080",
  "http://gateway:8080",
];

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function getApiBaseUrls() {
  const configured = process.env.MANAGENT_API_BASE_URL?.trim();
  const candidates = configured
    ? [configured, ...DEFAULT_API_BASE_URLS]
    : DEFAULT_API_BASE_URLS;

  return candidates
    .map(normalizeBaseUrl)
    .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);
}

async function shouldRetryWithAnotherBase(response: Response) {
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  const server = (response.headers.get("server") || "").toLowerCase();

  if (server.includes("jetty") && response.status >= 400) {
    return true;
  }

  if (contentType.includes("application/json")) {
    return false;
  }

  if (response.status >= 500) {
    return true;
  }

  if (response.status === 403 || response.status === 404) {
    try {
      const body = (await response.clone().text()).toLowerCase();
      if (
        body.includes("no valid crumb") ||
        body.includes("stapler") ||
        body.includes("jetty")
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

function getNetworkErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }
  const cause = "cause" in error ? error.cause : undefined;
  if (!cause || typeof cause !== "object" || !("code" in cause)) {
    return "";
  }
  return typeof cause.code === "string" ? cause.code : "";
}

function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof TypeError)) {
    return false;
  }

  const code = getNetworkErrorCode(error);
  return (
    code === "" ||
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT"
  );
}

export function getApiUnavailableMessage() {
  return "Authentication backend is not reachable right now. Make sure the gateway service is running and that MANAGENT_API_BASE_URL points to a reachable backend.";
}

export async function fetchFromApi(path: string, init?: RequestInit) {
  let lastError: unknown;
  let lastResponse: Response | undefined;

  for (const baseUrl of getApiBaseUrls()) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        cache: init?.cache ?? "no-store",
      });

      if (await shouldRetryWithAnotherBase(response)) {
        lastResponse = response;
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error)) {
        throw error;
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  const error = new Error(getApiUnavailableMessage()) as Error & {
    cause?: unknown;
  };
  error.cause = lastError;
  throw error;
}
