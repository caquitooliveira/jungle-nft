import { useEffect, useRef, useState } from 'react'
import { isAxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

export function AuthDialog() {
  const { isAuthOpen, closeAuth } = useAuth()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isAuthOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isAuthOpen && dialog.open) {
      dialog.close()
    }
  }, [isAuthOpen])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-dialog-title"
      onCancel={closeAuth}
      onClose={closeAuth}
      className="m-auto max-h-[90svh] w-[calc(100%-2rem)] max-w-sm overflow-auto border-0 border-b-4 border-[#cf8946] bg-[#281a13] p-7 font-mono text-[#f5eee8] backdrop:bg-black/25"
    >
      {isAuthOpen && <AuthForm />}
    </dialog>
  )
}

function AuthForm() {
  const { signIn, signUp, closeAuth } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)

  const isRegister = mode === 'register'

  async function submit(formElement: HTMLFormElement) {
    const form = new FormData(formElement)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    const confirmation = String(form.get('confirmation') ?? '')
    const username = String(form.get('username') ?? '').trim()

    setError('')

    if (isRegister && password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isRegister) {
        await signUp({ username, email, password })
      } else {
        await signIn({ email, password })
      }

      formElement.reset()
    } catch (error) {
      const message = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ??
          'Não foi possível conectar. Tente novamente.'
        : 'Não foi possível salvar sua sessão.'

      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (error) {
      errorRef.current?.focus()
    }
  }, [error])

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Fechar autenticação"
          onClick={closeAuth}
          className="flex size-8 items-center justify-center text-[#e6a15a]"
        >
          ×
        </button>
      </div>

      <h2 id="auth-dialog-title" className="sr-only">
        {isRegister ? 'Criar conta' : 'Entrar na conta'}
      </h2>

      <div
        role="group"
        aria-label="Escolher entrar ou criar conta"
        className="mb-5 flex justify-center gap-2 text-sm"
      >
        <button
          type="button"
          aria-pressed={!isRegister}
          disabled={isSubmitting}
          onClick={() => {
            setMode('login')
            setError('')
            setShowPassword(false)
          }}
          className={!isRegister ? 'text-[#e6a15a]' : ''}
        >
          Entrar
        </button>

        <span aria-hidden="true">|</span>

        <button
          type="button"
          aria-pressed={isRegister}
          disabled={isSubmitting}
          onClick={() => {
            setMode('register')
            setError('')
            setShowPassword(false)
          }}
          className={isRegister ? 'text-[#e6a15a]' : ''}
        >
          Criar conta
        </button>
      </div>

      <p className="mb-5 text-center text-xs leading-5 text-[#c9b6a5]">
        {isRegister
          ? 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'
          : 'Entre para gerenciar sua carteira, coleção e perfil de criador.'}
      </p>

      <form
        key={mode}
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault()

          if (!isSubmitting) {
            void submit(event.currentTarget)
          }
        }}
      >
        <fieldset disabled={isSubmitting} className="space-y-3">
          {isRegister && (
            <div>
              <label htmlFor="auth-username" className="sr-only">
                Nome de usuário
              </label>

              <Input
                autoFocus
                id="auth-username"
                name="username"
                required
                minLength={2}
                maxLength={40}
                autoComplete="nickname"
                placeholder="Nome de usuário"
                className="border-[#705039] bg-transparent text-xs"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="sr-only">
              E-mail
            </label>

            <Input
              autoFocus={!isRegister}
              id="auth-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              placeholder="Digite seu e-mail"
              className="border-[#705039] bg-transparent text-xs"
            />
          </div>

          <div className="relative">
            <label htmlFor="auth-password" className="sr-only">
              Senha
            </label>

            <Input
              id="auth-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={isRegister ? 8 : undefined}
              maxLength={128}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder="Senha"
              className="border-[#705039] bg-transparent pr-16 text-xs"
            />

            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute inset-y-0 right-2 text-[10px] text-[#e6a15a]"
            >
              
            </button>
          </div>

          {isRegister && (
            <div>
              <label htmlFor="auth-confirmation" className="sr-only">
                Confirmar senha
              </label>

              <Input
                id="auth-confirmation"
                name="confirmation"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Confirmar senha"
                className="border-[#705039] bg-transparent text-xs"
              />

              <p className="mt-2 text-[10px] text-[#c9b6a5]">
                Use pelo menos 8 caracteres.
              </p>
            </div>
          )}

          {!isRegister && (
            <p className="text-right text-[10px] text-[#c9b6a5]">
              Recuperação de senha indisponível nesta demonstração.
            </p>
          )}

          {error && (
            <p
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="text-xs text-red-300"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-[#cf8946] text-xs text-[#160e0a] hover:bg-[#e6a15a]"
          >
            {isSubmitting
              ? 'Aguarde...'
              : isRegister
                ? 'Criar conta'
                : 'Entrar'}
          </Button>
        </fieldset>
      </form>

      <p className="my-4 text-center text-[10px] text-[#c9b6a5]">
        Ou continue com
      </p>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full border-[#705039] bg-transparent text-xs text-[#f5eee8]"
        >
          <span className="text-[#e6a15a]">G</span>
          Entrar com Google
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full border-[#705039] bg-transparent text-xs text-[#f5eee8]"
        >
          <span className="text-blue-400">f</span>
          Entrar com Facebook
        </Button>
      </div>

      <p className="mt-3 text-center text-[10px] text-[#c9b6a5]">
        Login social indisponível nesta demonstração.
      </p>
    </>
  )
}