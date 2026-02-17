import { useEffect, useState } from 'react'
import { Facebook, Instagram, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { login, register } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!open) {
      setPassword('')
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isRegister) {
      await register(email, password)
    } else {
      await login(email, password)
    }
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div
          className={`max-h-[90vh] w-full max-w-md transform overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_25px_70px_-30px_rgba(0,0,0,0.45)] transition-all duration-300 ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Bienvenue chez KOKTEK
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Accedez a vos commandes
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4]">
                G
              </span>
              Google
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-4 text-sm font-semibold text-white transition hover:bg-[#166FE0]"
            >
              <Facebook className="h-5 w-5" />
              Facebook
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 text-sm font-semibold text-white"
            >
              <Instagram className="h-5 w-5" />
              Instagram
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-black bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              <span className="text-base font-bold">♪</span>
              TikTok
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            Ou avec votre email
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              {isRegister ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isRegister ? 'Deja un compte ?' : 'Pas de compte ?'}{' '}
            <button
              type="button"
              onClick={() => setIsRegister((prev) => !prev)}
              className="font-semibold text-gray-900 transition hover:text-black"
            >
              {isRegister ? 'Se connecter' : 'Creer un compte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
