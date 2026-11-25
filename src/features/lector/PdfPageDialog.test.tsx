import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { t } from '../../i18n'
import { PdfPageDialog } from './PdfPageDialog'

const destroy = vi.fn(async () => {})

vi.mock('../../lib/formats/pdf', () => ({
  loadPdfjs: async () => ({
    getDocument: () => ({
      promise: Promise.resolve({
        getPage: async () => ({
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({ promise: Promise.resolve() }),
        }),
      }),
      destroy,
    }),
  }),
}))

describe('PdfPageDialog', () => {
  it('libera el documento de pdfjs al cerrarse', async () => {
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']
    const { unmount } = render(<PdfPageDialog file={new Blob(['%PDF'])} page={1} onClose={() => {}} />)
    await new Promise((r) => setTimeout(r, 20))
    unmount()
    await waitFor(() => expect(destroy).toHaveBeenCalled())
  })

  it('atrapa el foco, describe la página y lo devuelve al cerrar', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const { unmount } = render(<PdfPageDialog file={new Blob(['%PDF'])} page={3} onClose={() => {}} />)
    const close = screen.getByRole('button', { name: t('docreader.close') })
    expect(document.activeElement).toBe(close)
    fireEvent.keyDown(close, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
    expect(screen.getByLabelText(t('docreader.pageAlt', { page: 3 }))).toBeInTheDocument()
    unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})
