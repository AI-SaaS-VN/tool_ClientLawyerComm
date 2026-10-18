// Next.js applies basePath automatically to <Link> and next/navigation
// redirects, but not to fetch/EventSource URLs, plain <a href>, or
// window.location. Client components route every same-origin URL through
// here so a basePath deployment (the /new parallel instance) keeps working.
// NEXT_PUBLIC_BASE_PATH is inlined into the client bundle at build time.
export function apiPath(path: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
