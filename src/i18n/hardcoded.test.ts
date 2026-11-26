// Guarda contra idioma escrito a mano en la interfaz: los registros y las fechas usan currentLang().
const files = import.meta.glob<string>(['/src/features/**/*.tsx', '!/src/features/**/*.test.tsx'], { query: '?raw', import: 'default', eager: true })

describe('idioma de la interfaz', () => {
  it('ningún registro nuevo ni formato de fecha usa "es" escrito a mano', () => {
    const offenders = Object.entries(files)
      .filter(([, src]) => /lang: 'es'|Intl\.\w+\('es'/.test(src))
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })
})
