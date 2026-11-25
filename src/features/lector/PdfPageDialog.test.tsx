import { render, waitFor } from '@testing-library/react'
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
})
