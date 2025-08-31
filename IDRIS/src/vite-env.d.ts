/// <reference types="vite/client" />

// (optional) declare your custom vars so TS knows they exist & are strings
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // add more: readonly VITE_SOMETHING_ELSE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
