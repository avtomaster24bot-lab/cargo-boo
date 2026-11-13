import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

function pngSize(path) {
  const buf = readFileSync(path)
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${path} is not PNG`)
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  return { width, height }
}

function mustExist(rel) {
  const path = resolve(root, rel)
  if (!existsSync(path)) throw new Error(`missing ${rel}`)
  return path
}

const manifest = JSON.parse(readFileSync(mustExist('public/manifest.webmanifest'), 'utf8'))
const checks = []
function check(ok, msg) {
  checks.push({ ok, msg })
  if (!ok) console.error('FAIL', msg)
  else console.log('OK  ', msg)
}

check(manifest.name === 'Vezu', 'manifest name is Vezu')
check(manifest.short_name === 'Vezu', 'manifest short_name is Vezu')
check(manifest.display === 'standalone', 'display standalone')
check(manifest.theme_color === '#1E3A7B', 'theme_color #1E3A7B')
check(manifest.start_url === '/cargo-boo/', 'start_url /cargo-boo/')
check(manifest.scope === '/cargo-boo/', 'scope /cargo-boo/')

const icons = manifest.icons ?? []
function hasIcon(size, purpose) {
  return icons.some((i) => i.sizes === `${size}x${size}` && String(i.purpose).includes(purpose) && i.type === 'image/png')
}
check(hasIcon(192, 'any'), '192 any icon')
check(hasIcon(512, 'any'), '512 any icon')
check(hasIcon(192, 'maskable'), '192 maskable icon')
check(hasIcon(512, 'maskable'), '512 maskable icon')

for (const icon of icons) {
  const rel = icon.src.replace(/^\//, '').replace(/^cargo-boo\//, 'public/')
  const path = resolve(root, rel)
  const { width, height } = pngSize(path)
  const [w, h] = icon.sizes.split('x').map(Number)
  check(width === w && height === h, `${icon.src} is ${w}x${h}`)
}

const apple = pngSize(mustExist('public/apple-touch-icon.png'))
check(apple.width === 180 && apple.height === 180, 'apple-touch-icon is 180x180')

const html = readFileSync(mustExist('index.html'), 'utf8')
check(html.includes('rel="manifest"') && html.includes('manifest.webmanifest'), 'manifest link')
check(html.includes('apple-touch-icon') && html.includes('apple-touch-icon.png'), 'apple-touch-icon link')
check(html.includes('theme-color') && html.includes('#1E3A7B'), 'theme-color meta')
check(html.includes('apple-mobile-web-app-capable'), 'apple-mobile-web-app-capable')
check(html.includes('apple-mobile-web-app-title') && html.includes('Vezu'), 'apple-mobile-web-app-title Vezu')

const sw = readFileSync(mustExist('public/sw.js'), 'utf8')
check(sw.includes("addEventListener('install'") || sw.includes('addEventListener("install"'), 'service worker install')
check(sw.includes("addEventListener('fetch'") || sw.includes('addEventListener("fetch"'), 'service worker fetch')
check(sw.includes('/cargo-boo/'), 'service worker scoped assets')

const failed = checks.filter((c) => !c.ok)
if (failed.length) {
  console.error(`\n${failed.length} PWA checks failed`)
  process.exit(1)
}
console.log(`\n${checks.length} PWA checks passed`)
