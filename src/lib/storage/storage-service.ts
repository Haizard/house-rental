export type UploadResult =
  | { ok: true; url: string; storageKey: string }
  | { ok: false; error: string };

export interface StorageService {
  /** Upload a file and return its public URL + storage key for DB persistence. */
  upload(params: {
    bucket: string;
    path: string;
    contentType: string;
    body: ArrayBuffer;
  }): Promise<UploadResult>;

  /** Delete a file by storage key. */
  delete(storageKey: string): Promise<void>;
}
