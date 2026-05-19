/** Repo subpath on GitHub Pages (empty when running locally). */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

export function withBasePath(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return basePath ? `${basePath}${p}` : p;
}
