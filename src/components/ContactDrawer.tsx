import { useState } from 'react'
import { MessageCircle, Phone, Send, ShieldCheck, X, Loader2, CheckCircle2 } from 'lucide-react'

type ContactDrawerProps = {
  open: boolean
  onClose: () => void
}

const ContactDrawer = ({ open, onClose }: ContactDrawerProps) => {
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !message) return
    
    setStatus('loading')
    try {
      const response = await fetch('https://formsubmit.co/ajax/contact@koktek.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email,
          _subject: subject || 'Nouveau message Koktek',
          message,
          _replyto: email, // Set the reply-to header to the customer's email
          _template: 'box' // Beautiful built-in template
        })
      })
      if (response.ok) {
        setStatus('success')
        setEmail('')
        setSubject('')
        setMessage('')
        setTimeout(() => setStatus('idle'), 6000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-[60] ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-4 left-4 right-4 flex max-h-[80vh] w-auto flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-transform duration-300 md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:max-h-none md:max-w-md md:rounded-none ${
          open ? 'translate-y-0 md:translate-x-0 md:translate-y-0' : 'translate-y-full md:translate-x-full md:translate-y-0'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
              Assistance premium
            </p>
            <h2 className="font-nunito text-xl font-bold text-gray-900">
              Conciergerie KOKTEK
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>
                Garantie Sérénité : 30 Jours Satisfait ou Remboursé
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Retours gratuits & Support Français
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <a
              href="tel:+33758775291"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-4 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              <Phone className="h-5 w-5" />
              Appeler le 07 58 77 52 91
            </a>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://wa.me/33758775291"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </a>
              <a
                href="https://t.me/koktek_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Send className="h-5 w-5" />
                Telegram
              </a>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              Ou écrivez-nous
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {status === 'success' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Message envoyé !
                </div>
                <p className="text-xs">
                  Nous vous répondrons très vite. (Il est possible que formsubmit.co vous demande une brève confirmation de votre rôle d'admin pour la première utilisation sur contact@koktek.com).
                </p>
              </div>
            )}
            {status === 'error' && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Oups ! Une erreur est survenue lors de l'envoi du message. Veuillez réessayer plus tard.
              </div>
            )}
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Sujet
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Commande, produit, livraison..."
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre demande..."
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le message'
              )}
            </button>
          </form>
        </div>

        <div className="border-t border-gray-200 px-4 py-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Réponse sous 24h</p>
          <p className="mt-1">contact@koktek.com</p>
        </div>
      </aside>
    </div>
  )
}

export default ContactDrawer
