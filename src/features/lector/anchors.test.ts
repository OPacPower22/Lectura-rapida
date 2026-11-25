import { rangeToAnchor, segmentsWithMarks, sentenceAround } from './anchors'

function setupParagraphs(html: string) {
  document.body.innerHTML = html
  return Array.from(document.querySelectorAll<HTMLElement>('[data-paragraph]'))
}

function textNodeContaining(el: Element, needle: string): Text {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode() as Text | null
  while (node && !node.data.includes(needle)) node = walker.nextNode() as Text | null
  if (!node) throw new Error(`no se encontró ${needle}`)
  return node
}

describe('rangeToAnchor', () => {
  it('calcula desplazamientos sobre el texto plano aunque haya marcas dentro', () => {
    const [p] = setupParagraphs('<p data-paragraph="0">Hola <mark>mundo</mark> cruel</p>')
    const node = textNodeContaining(p, 'cruel')
    const range = document.createRange()
    range.setStart(node, node.data.indexOf('cruel'))
    range.setEnd(node, node.data.indexOf('cruel') + 5)
    expect(rangeToAnchor(range, 3)).toEqual({ chapter: 3, paragraph: 0, start: 11, end: 16 })
  })

  it('recorta espacios en los extremos de la selección', () => {
    const [p] = setupParagraphs('<p data-paragraph="2">uno dos tres</p>')
    const node = p.firstChild as Text
    const range = document.createRange()
    range.setStart(node, 3)
    range.setEnd(node, 8)
    expect(rangeToAnchor(range, 0)).toEqual({ chapter: 0, paragraph: 2, start: 4, end: 7 })
  })

  it('detecta selecciones que cruzan párrafos', () => {
    const [a, b] = setupParagraphs('<p data-paragraph="0">primero</p><p data-paragraph="1">segundo</p>')
    const range = document.createRange()
    range.setStart(a.firstChild!, 2)
    range.setEnd(b.firstChild!, 3)
    expect(rangeToAnchor(range, 0)).toBe('cross-paragraph')
  })

  it('devuelve null fuera de un párrafo o con selección vacía', () => {
    setupParagraphs('<div id="fuera">texto</div><p data-paragraph="0">dentro</p>')
    const outside = document.createRange()
    outside.selectNodeContents(document.getElementById('fuera')!)
    expect(rangeToAnchor(outside, 0)).toBeNull()
    const collapsed = document.createRange()
    collapsed.setStart(document.querySelector('[data-paragraph]')!.firstChild!, 2)
    expect(rangeToAnchor(collapsed, 0)).toBeNull()
  })
})

describe('segmentsWithMarks', () => {
  it('divide el texto según las marcas', () => {
    expect(segmentsWithMarks('abcdef', [{ start: 1, end: 3, id: 1 }])).toEqual([
      { text: 'a' },
      { text: 'bc', markId: 1 },
      { text: 'def' },
    ])
  })
  it('en solapamientos gana la marca más reciente', () => {
    expect(
      segmentsWithMarks('abcdef', [
        { start: 0, end: 4, id: 1 },
        { start: 2, end: 6, id: 2 },
      ]),
    ).toEqual([
      { text: 'ab', markId: 1 },
      { text: 'cdef', markId: 2 },
    ])
  })
  it('sin marcas devuelve el texto completo', () => {
    expect(segmentsWithMarks('abc', [])).toEqual([{ text: 'abc' }])
  })
})

describe('sentenceAround', () => {
  it('devuelve la oración que contiene la posición', () => {
    const text = 'Primera oración. La sacada es un salto del ojo. Tercera.'
    expect(sentenceAround(text, text.indexOf('sacada'))).toBe('La sacada es un salto del ojo.')
  })
})
