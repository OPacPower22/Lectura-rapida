// Auditoría Lighthouse (perfil móvil) sobre la compilación de producción servida con `vite preview`.
// Uso: npm run lighthouse  → sale con código 1 si alguna categoría queda por debajo de 90.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'

const PORT = 4174
const BASE = `http://localhost:${PORT}/Lectura-rapida/`
const PAGES = ['', '#/programa', '#/progreso', '#/biblioteca']
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const MIN = 90
const OUT = '.superpowers/lighthouse'
const CHROME =
  process.env.CHROME_PATH ?? ['/opt/pw-browsers/chromium/chrome-linux64/chrome', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find((p) => existsSync(p))

if (!process.argv.includes('--no-build')) {
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true })
const stop = () => {
  try {
    process.kill(-server.pid)
  } catch {
    // ya terminado
  }
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return
    } catch {
      // aún arrancando
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('vite preview no respondió')
}

let failed = false
let chrome
try {
  await waitForServer()
  chrome = await chromeLauncher.launch({ chromePath: CHROME, chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] })
  mkdirSync(OUT, { recursive: true })
  for (const page of PAGES) {
    const url = BASE + page
    const result = await lighthouse(url, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: CATEGORIES })
    const lhr = result.lhr
    writeFileSync(`${OUT}/${(page || 'inicio').replace(/[^a-z]/gi, '') || 'inicio'}.json`, result.report)
    const scores = CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)])
    console.log(`${url}\n  ${scores.map(([c, s]) => `${c}: ${s}`).join(' · ')}`)
    for (const [c, s] of scores) {
      if (s < MIN) {
        failed = true
        const audits = lhr.categories[c].auditRefs
          .map((r) => lhr.audits[r.id])
          .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable')
          .map((a) => `    - ${a.id}: ${a.title} (${a.displayValue ?? a.score})`)
        console.log(`  ✘ ${c} < ${MIN}\n${audits.join('\n')}`)
      }
    }
  }
} catch (e) {
  console.error(e)
  failed = true
} finally {
  await chrome?.kill()
  stop()
}
process.exit(failed ? 1 : 0)
