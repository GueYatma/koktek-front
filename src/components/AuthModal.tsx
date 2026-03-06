import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { login, user } = useAuth()
  const { openProfile } = useUI()
  // Try to pre-fill from known user state if it exists, otherwise empty string
  const [email, setEmail] = useState(user?.email || '')

  useEffect(() => {
    if (open && user?.email && !email) {
      setEmail(user.email)
    }
  }, [open, user, email])

  const handleClose = () => {
    setEmail('')
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await login(email.trim())
    
    // Automatically open the order drawer on success
    onClose()
    setTimeout(() => {
      openProfile('orders')
    }, 150)
  }

  const modalTitle = user?.firstName 
    ? `Espace de ${user.firstName}` 
    : 'Espace client KOKTEK'

  return (
    <div
      className={`fixed inset-0 z-[60] ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed top-[10%] bottom-[10%] left-4 right-4 flex h-auto max-h-[80vh] w-auto flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:max-h-none md:max-w-md md:rounded-none ${
          open ? 'translate-y-0 opacity-100 md:translate-x-0 md:translate-y-0' : 'translate-y-8 opacity-0 md:translate-x-full md:translate-y-0 md:opacity-100'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-4 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{modalTitle}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Accedez a vos commandes via votre email
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285F4]">
                G
              </span>
              Continuer avec Google
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            Email
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[16px] text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                required
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              Acceder a mon espace
            </button>
          </form>
        </div>
      </aside>
    </div>
  )
}

export default AuthModal
