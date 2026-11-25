import { useState } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { routes } from './routes'

export function App() {
  // El router se crea al montar, después de que main.tsx haya ajustado la URL (p. ej. «Compartir»).
  const [router] = useState(() => createHashRouter(routes))
  return <RouterProvider router={router} />
}
