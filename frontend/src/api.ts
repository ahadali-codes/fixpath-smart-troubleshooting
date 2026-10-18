export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch("/api" + path, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-FixPath": "1",
      ...options.headers,
    },
  });
  if (!response.ok) {
    if (
      response.status === 401 &&
      !["/auth/login", "/auth/register", "/auth/me"].includes(path)
    )
      window.dispatchEvent(new Event("fixpath:unauthorized"));
    const data = await response.json().catch(() => ({}));
    let message = data.detail;
    if (Array.isArray(message))
      message = message
        .map((x: any) => `${x.loc?.slice(1).join(".")}: ${x.msg}`)
        .join("; ");
    throw new Error(message || `Request failed (${response.status}).`);
  }
  return response.status === 204 ? undefined : response.json();
}
export const send = (method: string, data?: unknown) => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
});
