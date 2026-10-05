import { defineConfig } from 'vitest/config'

// Test dei calcoli (test/*.test.ts): senza i plugin dell'app, solo Node.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'], environment: 'node' },
})
