import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { useInertOutside } from './useInertOutside'

function Modal() {
  const ref = useRef<HTMLDivElement>(null)
  useInertOutside(ref)
  return (
    <div ref={ref} role="dialog" aria-modal="true">
      <button type="button">Dentro</button>
    </div>
  )
}

function Page({ open }: { open: boolean }) {
  return (
    <div>
      <header><a href="#x">Menú</a></header>
      <main>
        <button type="button">Fuera</button>
        <section>{open && <Modal />}</section>
      </main>
    </div>
  )
}

describe('useInertOutside', () => {
  it('mientras el diálogo está abierto, todo lo demás queda inerte; al cerrarlo se restaura', () => {
    const { rerender } = render(<Page open />)
    expect(screen.getByRole('link', { name: 'Menú' }).closest('[inert]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Fuera' }).closest('[inert]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Dentro' }).closest('[inert]')).toBeNull()
    rerender(<Page open={false} />)
    expect(document.querySelectorAll('[inert]')).toHaveLength(0)
  })
})
