import type { StorageService, UploadResult } from "./storage-service";

/**
 * Supabase Storage REST API implementation.
 * Uses the project's service-role key for server-side uploads.
 * Env vars: SUPABASE_PROJECT_URL, supabase_service_role_secret
 */
class SupabaseStorage implements StorageService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const url = process.env.SUPABASE_PROJECT_URL ?? process.env.supabase_project_url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.supabase_service_role_secret ?? process.env.SUPABASE_SERVICE_ROLE_SECRET;
    if (!url) throw new Error("SUPABASE_PROJECT_URL must be set for file uploads.");
    if (!key) throw new Error("supabase_service_role_secret must be set for file uploads.");
    this.baseUrl = url.replace(/\/$/, "");
    this.apiKey = key;
  }

  async upload({ bucket, path, contentType, body }: {
    bucket: string;
    path: string;
    contentType: string;
    body: ArrayBuffer;
  }): Promise<UploadResult> {
    const url = `${this.baseUrl}/storage/v1/object/${bucket}/${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      return { ok: false, error: `Upload failed (${response.status}): ${text}` };
    }

    // Build public URL
    const publicUrl = `${this.baseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return {
      ok: true,
      url: publicUrl,
      storageKey: `${bucket}/${path}`,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const [bucket, ...rest] = storageKey.split("/");
    const path = rest.join("/");
    const url = `${this.baseUrl}/storage/v1/object/${bucket}/${path}`;

    await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
  }
}

/**
 * Fallback when storage is not configured — returns a placeholder.
 * Useful for local development without Supabase Storage.
 */
class LocalPlaceholderStorage implements StorageService {
  async upload({ path }: { bucket: string; path: string; contentType: string; body: ArrayBuffer }): Promise<UploadResult> {
    return {
      ok: true,
      url: `/listing-placeholder.svg`,
      storageKey: `local/${path}`,
    };
  }

  async delete(): Promise<void> {
    // No-op for local placeholder
  }
}

let _service: StorageService | null = null;

function getStorageService(): StorageService {
  if (_service) return _service;
  try {
    _service = new SupabaseStorage();
    return _service;
  } catch {
    console.warn("Supabase Storage is not configured. Using local placeholder. Set SUPABASE_PROJECT_URL and supabase_service_role_secret for real uploads.");
    _service = new LocalPlaceholderStorage();
    return _service;
  }
}

/** Lazy proxy — defers storage-service creation until first use so env vars are available. */
export const storageService: StorageService = {
  upload(args) { return getStorageService().upload(args); },
  delete(key) { return getStorageService().delete(key); },
};
