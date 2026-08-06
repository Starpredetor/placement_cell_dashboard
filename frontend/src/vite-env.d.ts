/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL, including the /api/v1 prefix. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
