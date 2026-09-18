import assert from "node:assert/strict";
import test from "node:test";

const localStore = new Map<string, string>();

globalThis.window = {
  localStorage: {
    getItem(key: string) {
      return localStore.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      localStore.set(key, value);
    },
    removeItem(key: string) {
      localStore.delete(key);
    },
  },
  setTimeout,
  clearTimeout,
  dispatchEvent() {
    return true;
  },
} as unknown as Window & typeof globalThis;

Object.defineProperty(import.meta, "env", {
  value: {
    VITE_SUPABASE_URL: "https://example.supabase.co",
    VITE_SUPABASE_ANON_KEY: "anon-key",
  },
  configurable: true,
});

const { DEFAULT_CONFIG } = await import("../src/config/site-config.ts");
const { loadConfig, saveConfig } = await import("../src/services/dataAdapter.ts");

test("loadConfig keeps local storage mode when the user has selected local save", () => {
  const saved = {
    ...DEFAULT_CONFIG,
    admin: {
      ...DEFAULT_CONFIG.admin,
      storageMode: "local",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    },
  };
  localStore.clear();
  localStore.set("funnel_site_config_v1", JSON.stringify(saved));

  const config = loadConfig();
  assert.equal(config.admin.storageMode, "local");
});

test("saveConfig stores a local copy even if Supabase sync fails", async () => {
  localStore.clear();
  globalThis.fetch = async () => {
    throw new Error("network");
  };

  const config = {
    ...DEFAULT_CONFIG,
    admin: {
      ...DEFAULT_CONFIG.admin,
      storageMode: "database",
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    },
  };

  const result = await saveConfig(config);
  assert.equal(result, true);
  assert.ok(localStore.has("funnel_site_config_v1"));
});
