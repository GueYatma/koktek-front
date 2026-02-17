import { MessageCircle, Phone, Send, ShieldCheck, X } from 'lucide-react'

type ContactDrawerProps = {
  open: boolean
  onClose: () => void
}

const ContactDrawer = ({ open, onClose }: ContactDrawerProps) => {
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
        className={`fixed inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
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
              href="tel:0758775291"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-4 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              <Phone className="h-5 w-5" />
              Appeler le 07 58 77 52 91
            </a>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle className="h-5 w-5" />
                WhatsApp
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Send className="h-5 w-5" />
                Telegram
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              Ou écrivez-nous
              <span className="h-px flex-1 bg-gray-200" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Email
              </label>
              <input
                type="email"
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
                placeholder="Commande, produit, livraison..."
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Message
              </label>
              <textarea
                rows={5}
                placeholder="Décrivez votre demande..."
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-xl border-2 border-black px-4 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              Envoyer
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-5 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">Réponse sous 24h</p>
          <p className="mt-1">contact@koktek.com</p>
        </div>
      </aside>
    </div>
  )
}

export default ContactDrawer
