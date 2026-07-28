/**
 * Swaps an image preview URL, releasing the one it replaces.
 *
 * Both entry forms created object URLs for previews and never revoked them, so
 * picking a different file repeatedly leaked one blob per pick. Server-hosted
 * previews are left alone — only blob: URLs are ours to revoke.
 */
export function replaceObjectUrl(
  previous: string | null | undefined,
  file?: File,
): string | null {
  if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
  return file ? URL.createObjectURL(file) : null
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}
