/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REMOTE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
