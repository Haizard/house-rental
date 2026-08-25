/**
 * IndexedDB wrapper for offline listing cache.
 *
 * Stores up to 20 recently viewed listings with all detail data
 * so students can browse them without internet connectivity.
 */

const DB_NAME = "nyumba-offline";
const DB_VERSION = 1;
const LISTINGS_STORE = "listings";
const SEARCH_CACHE_STORE = "search-cache";
const MAX_CACHED_LISTINGS = 20;
const MAX_CACHED_SEARCHES = 10;
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CachedListing = {
  id: string;
  data: unknown;
  cachedAt: number;
  expiresAt: number;
};

type CachedSearch = {
  key: string;
  data: unknown;
  cachedAt: number;
  expiresAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(LISTINGS_STORE)) {
        db.createObjectStore(LISTINGS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SEARCH_CACHE_STORE)) {
        db.createObjectStore(SEARCH_CACHE_STORE, { keyPath: "key" });
      }
    };
  });
}

// ─── Listings ───

export async function cacheListing(id: string, data: unknown): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(LISTINGS_STORE, "readwrite");
    const store = tx.objectStore(LISTINGS_STORE);

    const now = Date.now();
    const entry: CachedListing = {
      id,
      data,
      cachedAt: now,
      expiresAt: now + CACHE_EXPIRY_MS,
    };

    store.put(entry);

    // Evict oldest if over limit
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > MAX_CACHED_LISTINGS) {
        const cursorReq = store.openCursor();
        let deleteCount = countReq.result - MAX_CACHED_LISTINGS;
        cursorReq.onsuccess = () => {
          if (cursorReq.result && deleteCount > 0) {
            cursorReq.result.delete();
            deleteCount--;
            cursorReq.result.continue();
          }
        };
      }
    };

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // don't block on cache errors
    });
  } catch {
    // IndexedDB unavailable — silently skip
  }
}

export async function getCachedListing(id: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(LISTINGS_STORE, "readonly");
    const store = tx.objectStore(LISTINGS_STORE);

    return new Promise((resolve) => {
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as CachedListing | undefined;
        if (!result) return resolve(null);
        if (Date.now() > result.expiresAt) {
          // Expired — delete and return null
          const delTx = db.transaction(LISTINGS_STORE, "readwrite");
          delTx.objectStore(LISTINGS_STORE).delete(id);
          return resolve(null);
        }
        resolve(result.data);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllCachedListings(): Promise<Array<{ id: string; data: unknown; cachedAt: number }>> {
  try {
    const db = await openDB();
    const tx = db.transaction(LISTINGS_STORE, "readonly");
    const store = tx.objectStore(LISTINGS_STORE);

    return new Promise((resolve) => {
      const results: Array<{ id: string; data: unknown; cachedAt: number }> = [];
      const now = Date.now();
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const entry = cursor.value as CachedListing;
          if (entry.expiresAt > now) {
            results.push({ id: entry.id, data: entry.data, cachedAt: entry.cachedAt });
          }
          cursor.continue();
        } else {
          resolve(results.sort((a, b) => b.cachedAt - a.cachedAt));
        }
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ─── Search Cache ───

export async function cacheSearchResults(key: string, data: unknown): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(SEARCH_CACHE_STORE, "readwrite");
    const store = tx.objectStore(SEARCH_CACHE_STORE);

    const now = Date.now();
    const entry: CachedSearch = { key, data, cachedAt: now, expiresAt: now + CACHE_EXPIRY_MS };
    store.put(entry);

    // Evict oldest
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result > MAX_CACHED_SEARCHES) {
        const cursorReq = store.openCursor();
        let deleteCount = countReq.result - MAX_CACHED_SEARCHES;
        cursorReq.onsuccess = () => {
          if (cursorReq.result && deleteCount > 0) {
            cursorReq.result.delete();
            deleteCount--;
            cursorReq.result.continue();
          }
        };
      }
    };

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // silently skip
  }
}

export async function getCachedSearchResults(key: string): Promise<unknown | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(SEARCH_CACHE_STORE, "readonly");
    const store = tx.objectStore(SEARCH_CACHE_STORE);

    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const result = req.result as CachedSearch | undefined;
        if (!result) return resolve(null);
        if (Date.now() > result.expiresAt) {
          const delTx = db.transaction(SEARCH_CACHE_STORE, "readwrite");
          delTx.objectStore(SEARCH_CACHE_STORE).delete(key);
          return resolve(null);
        }
        resolve(result.data);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ─── Utilities ───

export async function clearOfflineCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([LISTINGS_STORE, SEARCH_CACHE_STORE], "readwrite");
    tx.objectStore(LISTINGS_STORE).clear();
    tx.objectStore(SEARCH_CACHE_STORE).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // silently skip
  }
}

export async function getOfflineCacheSize(): Promise<{ listings: number; searches: number }> {
  try {
    const db = await openDB();
    const tx = db.transaction([LISTINGS_STORE, SEARCH_CACHE_STORE], "readonly");
    const listingsCount = await new Promise<number>((resolve) => {
      const req = tx.objectStore(LISTINGS_STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
    const searchesCount = await new Promise<number>((resolve) => {
      const req = tx.objectStore(SEARCH_CACHE_STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
    return { listings: listingsCount, searches: searchesCount };
  } catch {
    return { listings: 0, searches: 0 };
  }
}
