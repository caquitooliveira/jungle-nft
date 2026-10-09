import { RouterProvider } from '@tanstack/react-router'
import { AuthProvider } from '@/components/auth/auth-provider'
import { AuthDialog } from '@/components/auth/auth-dialog'
import { router } from '@/router'
import { RealtimeConnection } from '@/components/realtime-connection'

function App() {
  return (
    <AuthProvider>
      <RealtimeConnection />
      <RouterProvider router={router} />
      <AuthDialog />
    </AuthProvider>
  )
}

export default App