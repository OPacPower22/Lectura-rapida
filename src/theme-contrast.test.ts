/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const themes = Object.fromEntries(
  [...css.matchAll(/\[data-theme='(\w+)'\]\s*\{([^}]*)\}/g)].map(([, name, body]) => [
    name,
    Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/g)].map(([, k, v]) => [k, v])),
  ]),
) as Record<string, Record<string, string>>

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

describe.each(['light', 'sepia', 'dark'])('tema %s', (name) => {
  const v = themes[name]
  it.each([
    ['ink', 'page'],
    ['ink', 'surface'],
    ['muted', 'surface'],
    ['on-accent', 'accent'],
    ['accent-ink', 'accent-soft'],
    ['warn-ink', 'warn-bg'],
    ['err-ink', 'err-bg'],
    ['ink', 'mark'],
    ['ink', 'pace'],
  ])('%s sobre %s cumple AA (4,5:1)', (fg, bg) => {
    expect(contrast(v[fg], v[bg])).toBeGreaterThanOrEqual(4.5)
  })
  it('el resaltado del marcapasos se distingue del fondo (≥ 1,5:1)', () => {
    expect(contrast(v.pace, v.page)).toBeGreaterThanOrEqual(1.5)
  })
})
