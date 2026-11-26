import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { t } from '../../i18n'
import { db } from '../../lib/storage/db'
import { createProject } from '../../lib/storage/projects'
import { ProjectsPage } from './ProjectsPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

function app() {
  return render(
    <MemoryRouter initialEntries={['/proyectos']}>
      <Routes>
        <Route path="/proyectos" element={<ProjectsPage />} />
        <Route path="/proyectos/:id" element={<p>editor</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProjectsPage', () => {
  it('lista los proyectos existentes', async () => {
    await createProject({ title: 'Plancha de prueba', kind: 'plancha' })
    app()
    expect(await screen.findByRole('link', { name: /Plancha de prueba/ })).toBeInTheDocument()
  })

  it('crea un proyecto y abre el editor', async () => {
    app()
    await userEvent.type(await screen.findByLabelText(t('projects.newTitle')), 'Trazado sobre la atención')
    await userEvent.selectOptions(screen.getByLabelText(t('projects.kind')), 'trazado')
    await userEvent.click(screen.getByRole('button', { name: t('projects.create') }))
    expect(await screen.findByText('editor')).toBeInTheDocument()
    expect((await db.projects.toArray())[0]).toMatchObject({ title: 'Trazado sobre la atención', kind: 'trazado' })
  })
})
