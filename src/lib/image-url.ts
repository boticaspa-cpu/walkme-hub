/**
 * Helpers to serve resized images via Supabase Storage Image Transform.
 * Converts public URLs (`/storage/v1/object/public/...`) to render URLs
 * (`/storage/v1/render/image/public/...?width=…&quality=…`).
 *
 * Falls back to the original URL if the input is not a Supabase public URL
 * (e.g. external URLs, blob: URLs, data: URLs, local placeholders).
 */

const PUBLIC_PREFIX = "/storage/v1/object/public/";
const RENDER_PREFIX = "/storage/v1/render/image/public/";

function transform(url: string | undefined | null, width: number, quality = 75): string {
  if (!url) return "";
  // Skip non-Supabase URLs (placeholders, blobs, external)
  if (!url.includes(PUBLIC_PREFIX)) return url;

  try {
    const u = new URL(url);
    u.pathname = u.pathname.replace(PUBLIC_PREFIX, RENDER_PREFIX);
    u.searchParams.set("width", String(width));
    u.searchParams.set("quality", String(quality));
    u.searchParams.set("resize", "cover");
    return u.toString();
  } catch {
    return url;
  }
}

/** Thumbnail for grid cards (~600px). */
export function tourThumb(url: string | undefined | null, width = 600): string {
  return transform(url, width, 70);
}

/** Full-size image for detail views / carousels (~1200px). */
export function tourFull(url: string | undefined | null, width = 1200): string {
  return transform(url, width, 80);
}

/** srcSet for retina displays. */
export function tourThumbSrcSet(url: string | undefined | null, width = 600): string {
  if (!url || !url.includes(PUBLIC_PREFIX)) return "";
  return `${transform(url, width, 70)} 1x, ${transform(url, width * 2, 70)} 2x`;
}
