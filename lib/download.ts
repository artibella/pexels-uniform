/**
 * Adds Pexels' `dl` parameter, which makes the image and video CDNs respond with
 * `Content-Disposition: attachment` and the given filename.
 */
export function toAttachmentUrl(url: string, filename: string): string {
  const attachmentUrl = new URL(url);
  attachmentUrl.searchParams.set("dl", filename);
  return attachmentUrl.toString();
}

/**
 * Downloads a Pexels file.
 * The `download` attribute is ignored for cross-origin URLs, and downloads started
 * inside the Uniform iframe can be blocked by its sandbox. Opening the attachment
 * URL in a new tab avoids both: the browser saves the file and closes the tab.
 */
export function downloadFile(url: string, filename: string): void {
  window.open(toAttachmentUrl(url, filename), "_blank", "noopener,noreferrer");
}
