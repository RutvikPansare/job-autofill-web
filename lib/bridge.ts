/**
 * bridge.ts
 *
 * TypeScript replacement for mock_chrome.js.
 * Provides the same chrome.storage + chrome.runtime postMessage bridge
 * between the Next.js web app and the Chrome extension content-script.
 *
 * Content-script postMessage protocol (from contentScript.js):
 *   JOBFILL_PING                 → JOBFILL_PONG
 *   JOBFILL_STORAGE_GET + reqId  → JOBFILL_STORAGE_GET_RESPONSE + result
 *   JOBFILL_STORAGE_SET + reqId  → JOBFILL_STORAGE_SET_RESPONSE
 *   JOBFILL_STORAGE_REMOVE + reqId → JOBFILL_STORAGE_REMOVE_RESPONSE
 *   JOBFILL_OPEN_AUTH_POPUP      → JOBFILL_OPEN_AUTH_POPUP_RESPONSE
 *
 * When the real chrome.* API IS available (extension popup context),
 * all calls go directly through chrome.storage.local / chrome.runtime
 * without any postMessage overhead.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// chrome is injected by the browser extension runtime; not available in plain web context.
declare const chrome: any;

/**
 * True only when running inside a real Chrome extension context
 * (popup, options page, service worker).
 *
 * On a regular webpage chrome.runtime exists but chrome.runtime.id is
 * undefined — calling chrome.runtime.sendMessage() from there throws
 * "must specify an Extension ID". We use this guard everywhere so that
 * all postMessage bridging kicks in automatically when on the website.
 */
function isExtensionContext(): boolean {
  try {
    return typeof chrome !== "undefined" && !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

type StorageResult = Record<string, unknown>;
type OnChangedCb   = (
  changes: Record<string, { oldValue: unknown; newValue: unknown }>,
  area: string
) => void;

const TIMEOUT_MS = 1500;

class ExtensionBridge {
  private pending     = new Map<string, { resolve: (v: unknown) => void; timer: ReturnType<typeof setTimeout> }>();
  private reqCounter  = 0;
  private extReady    = false;
  private readyProm:  Promise<boolean> | null = null;
  private listeners:  OnChangedCb[] = [];
  private inited      = false;

  // ── internal helpers ──────────────────────────────────────────────────────

  private id(): string {
    return `jf_${++this.reqCounter}_${Date.now()}`;
  }

  /** One-time setup of the window.message listener */
  init(): void {
    if (this.inited || typeof window === "undefined") return;
    this.inited   = true;
    this.extReady = !!document.getElementById("jobfill-extension-installed");

    window.addEventListener("message", (ev) => {
      if (ev.source !== window) return;
      const { action, reqId, result, changes } = (ev.data || {}) as Record<string, unknown>;

      if (action === "JOBFILL_STORAGE_CHANGED" && changes && typeof changes === "object") {
        this.fireOnChanged(
          changes as Record<string, { oldValue: unknown; newValue: unknown }>
        );
        return;
      }

      if (!reqId || !this.pending.has(reqId as string)) return;

      if (
        action === "JOBFILL_STORAGE_GET_RESPONSE"       ||
        action === "JOBFILL_STORAGE_SET_RESPONSE"       ||
        action === "JOBFILL_STORAGE_REMOVE_RESPONSE"    ||
        action === "JOBFILL_OPEN_AUTH_POPUP_RESPONSE"   ||
        action === "JOBFILL_GOOGLE_SHEETS_RESPONSE"
      ) {
        const { resolve, timer } = this.pending.get(reqId as string)!;
        clearTimeout(timer);
        this.pending.delete(reqId as string);
        resolve(action === "JOBFILL_STORAGE_GET_RESPONSE" ? result : ev.data);
      }
    });
  }

  /** Poll for the extension marker element, resolve true/false after timeout */
  waitForExtension(ms = 2000): Promise<boolean> {
    if (this.extReady) return Promise.resolve(true);
    if (this.readyProm) return this.readyProm;

    this.readyProm = new Promise((resolve) => {
      const start = Date.now();
      const tick  = () => {
        if (document.getElementById("jobfill-extension-installed")) {
          this.extReady = true;
          resolve(true);
        } else if (Date.now() - start >= ms) {
          console.warn("[Bridge] Extension not detected — falling back to localStorage.");
          resolve(false);
        } else {
          setTimeout(tick, 50);
        }
      };
      tick();
    });

    return this.readyProm;
  }

  /** Read from localStorage (fallback when extension not installed) */
  private localGet(keys: string | string[]): StorageResult {
    const arr = typeof keys === "string" ? [keys] : keys;
    const out: StorageResult = {};
    for (const k of arr) {
      const v = localStorage.getItem(k);
      if (v != null) {
        try { out[k] = JSON.parse(v); } catch { out[k] = v; }
      }
    }
    return out;
  }

  /** Fire the in-memory onChanged listeners (used when writing to localStorage) */
  private fireOnChanged(changes: Record<string, { oldValue: unknown; newValue: unknown }>): void {
    this.listeners.forEach((cb) => cb(changes, "local"));
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Read one or more keys from chrome.storage.local (or localStorage fallback).
   */
  async storageGet(keys: string | string[]): Promise<StorageResult> {
    this.init();

    // Real chrome.storage available (extension popup context)
    if (isExtensionContext()) {
      return new Promise((resolve) =>
        chrome.storage.local.get(
          Array.isArray(keys) ? keys : [keys],
          (r: StorageResult) => resolve(r)
        )
      );
    }

    const keyArr = typeof keys === "string" ? [keys] : keys;
    const ready  = await this.waitForExtension();
    if (!ready) return this.localGet(keys);

    return new Promise((resolve) => {
      const reqId = this.id();
      const timer = setTimeout(() => {
        this.pending.delete(reqId);
        resolve(this.localGet(keys));
      }, TIMEOUT_MS);

      this.pending.set(reqId, { resolve: resolve as (v: unknown) => void, timer });
      window.postMessage({ action: "JOBFILL_STORAGE_GET", reqId, keys: keyArr }, "*");
    });
  }

  /**
   * Write one or more keys to chrome.storage.local (or localStorage).
   * Always fires onChanged listeners immediately for optimistic UI.
   */
  async storageSet(data: Record<string, unknown>): Promise<void> {
    this.init();

    if (isExtensionContext()) {
      return new Promise((resolve) => chrome.storage.local.set(data, () => resolve()));
    }

    // Immediate localStorage write + fire listeners
    const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {};
    for (const k in data) {
      const old = (() => { try { return JSON.parse(localStorage.getItem(k) ?? "null"); } catch { return undefined; } })();
      localStorage.setItem(k, JSON.stringify(data[k]));
      changes[k] = { oldValue: old, newValue: data[k] };
    }
    this.fireOnChanged(changes);

    // Also push to extension storage via postMessage
    const ready = await this.waitForExtension();
    if (!ready) return;

    return new Promise((resolve) => {
      const reqId = this.id();
      const timer = setTimeout(() => { this.pending.delete(reqId); resolve(); }, TIMEOUT_MS);
      this.pending.set(reqId, { resolve: resolve as (v: unknown) => void, timer });
      window.postMessage({ action: "JOBFILL_STORAGE_SET", reqId, payload: data }, "*");
    });
  }

  /**
   * Remove one or more keys from chrome.storage.local (or localStorage).
   * Fires onChanged listeners so hosted pages stay in sync with extension state.
   */
  async storageRemove(keys: string | string[]): Promise<void> {
    this.init();

    const keyArr = Array.isArray(keys) ? keys : [keys];

    if (isExtensionContext()) {
      return new Promise((resolve) => chrome.storage.local.remove(keyArr, () => resolve()));
    }

    const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {};
    for (const key of keyArr) {
      const old = (() => {
        try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return undefined; }
      })();
      localStorage.removeItem(key);
      changes[key] = { oldValue: old, newValue: undefined };
    }
    this.fireOnChanged(changes);

    const ready = await this.waitForExtension();
    if (!ready) return;

    return new Promise((resolve) => {
      const reqId = this.id();
      const timer = setTimeout(() => { this.pending.delete(reqId); resolve(); }, TIMEOUT_MS);
      this.pending.set(reqId, { resolve: resolve as (v: unknown) => void, timer });
      window.postMessage({ action: "JOBFILL_STORAGE_REMOVE", reqId, keys: keyArr }, "*");
    });
  }

  /**
   * Send a message to the background service worker.
   * Mirrors dashboard.js's sendRuntimeMessage().
   *
   * Supported actions:
   *   JF_OPEN_AUTH_POPUP  → relayed through content-script postMessage bridge
   *   JF_GOOGLE_SHEETS    → requires real chrome.runtime (extension popup context)
   *   all others          → require real chrome.runtime
   */
  async sendRuntimeMessage(
    message: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.init();

    // Real runtime available (extension popup / options page / service worker)
    if (isExtensionContext()) {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response: Record<string, unknown> | undefined) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve((response ?? {}) as Record<string, unknown>);
        });
      });
    }

    // Auth popup — proxied via content-script postMessage bridge (webpage context)
    if (message.action === "JF_OPEN_AUTH_POPUP") {
      const reqId = this.id();
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          this.pending.delete(reqId);
          resolve({ success: false, error: "Auth popup timeout" });
        }, 10_000);
        this.pending.set(reqId, { resolve: resolve as (v: unknown) => void, timer });
        window.postMessage(
          { action: "JOBFILL_OPEN_AUTH_POPUP", reqId, mode: message.mode ?? "google" },
          "*"
        );
      });
    }

    // Google Sheets — proxied via content-script postMessage bridge (webpage context)
    if (message.action === "JF_GOOGLE_SHEETS") {
      const ready = await this.waitForExtension();
      if (!ready) return { success: false, error: "Extension not detected. Please ensure the JobFill extension is installed and enabled." };
      const reqId = this.id();
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          this.pending.delete(reqId);
          resolve({ success: false, error: `Google Sheets request (${message.type as string}) timed out after 30s. Please try again.` });
        }, 30_000);
        this.pending.set(reqId, { resolve: resolve as (v: unknown) => void, timer });
        window.postMessage(
          { action: "JOBFILL_GOOGLE_SHEETS", reqId, type: message.type, payload: message.payload ?? {} },
          "*"
        );
      });
    }

    // No bridge for other unrecognised messages
    return {};
  }

  /**
   * Subscribe to chrome.storage.onChanged events.
   * Returns an unsubscribe function (for useEffect cleanup).
   */
  onChanged(cb: OnChangedCb): () => void {
    this.init();

    if (isExtensionContext()) {
      chrome.storage.onChanged.addListener(cb);
      return () => chrome.storage.onChanged.removeListener(cb);
    }

    this.listeners.push(cb);
    return () => {
      const i = this.listeners.indexOf(cb);
      if (i !== -1) this.listeners.splice(i, 1);
    };
  }
}

// Singleton — safe to import at module level; lazy-inits on first use
export const bridge = new ExtensionBridge();
