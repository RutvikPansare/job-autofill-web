/**
 * Checks if the JobFill Chrome Extension is installed and active on the page.
 * Uses the same DOM-check + ping/pong approach as the vanilla extension utils.
 */
export async function isExtensionInstalled(): Promise<boolean> {
  if (typeof document === "undefined") return false;

  // 1. Fast synchronous DOM check
  if (document.getElementById("jobfill-extension-installed")) return true;

  // 2. Ping/pong fallback
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      window.removeEventListener("message", listener);
      resolve(false);
    }, 500);

    const listener = (event: MessageEvent) => {
      if (event.data?.action === "JOBFILL_PONG") {
        clearTimeout(timeout);
        window.removeEventListener("message", listener);
        resolve(true);
      }
    };

    window.addEventListener("message", listener);
    window.postMessage({ action: "JOBFILL_PING" }, "*");
  });
}
