import { RouterProvider } from '@tanstack/react-router'
import { AuthProvider } from '@/components/auth/auth-provider'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { router } from '@/router'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <AuthDialog />
    </AuthProvider>
  )
}

export default App