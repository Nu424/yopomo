import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// GitHub Pages用のbaseパスを決定する。
// GitHub Actionsでは、GITHUB_REPOSITORYは"owner/repo"形式で、GITHUB_ACTIONS === "true"となる。
const env = (globalThis as any)?.process?.env as Record<string, string | undefined> | undefined
const repo = env?.GITHUB_REPOSITORY?.split('/')[1]
const isCI = env?.GITHUB_ACTIONS === 'true'
const isUserOrOrgSite = repo?.toLowerCase().endsWith('.github.io')
const base = isCI && repo && !isUserOrOrgSite ? `/${repo}/` : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: { host: true },
  base,
})
