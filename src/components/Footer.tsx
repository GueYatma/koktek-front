import { Link } from 'react-router-dom'
import { MessageCircle, Phone, Send } from 'lucide-react'
import { useUI } from '../context/UIContext'

type FooterProps = {
  buildLabel?: string
  buildDateLabel?: string
}

const Footer = ({ buildLabel, buildDateLabel }: FooterProps) => {
  const { openContact } = useUI()

  const footerImage = '/footer-stand.jpg'

  return (
    <footer className="mt-6 border-t border-gray-200 bg-gray-100 pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div
          className="relative min-h-[150px] overflow-hidden rounded-3xl bg-center bg-cover p-5"
          style={{ backgroundImage: `url(${footerImage})` }}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 text-left">
            <p className="text-sm font-semibold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
              KOKTEK - Accessoires pour toutes les marques. Commandez en ligne,
              payez en espèces et retirez sur nos stands en Provence.
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-gray-700">
          <a
            href="tel:+33758775291"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 transition hover:border-gray-300 hover:text-gray-900"
          >
            <Phone className="h-3.5 w-3.5" />
            Appeler
          </a>
          <a
            href="https://wa.me/33758775291"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 transition hover:border-gray-300 hover:text-gray-900"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
          <a
            href="https://t.me/koktek_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 transition hover:border-gray-300 hover:text-gray-900"
          >
            <Send className="h-3.5 w-3.5" />
            Telegram
          </a>
        </div>

        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Boutique</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Link to="/" className="hover:text-gray-900">
                Accueil
              </Link>
              <Link to="/catalogue" className="hover:text-gray-900">
                Catalogue
              </Link>
              <Link to="/catalogue?search=nouveautes" className="hover:text-gray-900">
                Nouveautés
              </Link>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Service Client</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={openContact}
                className="text-left transition hover:text-gray-900"
              >
                Contact
              </button>
              <Link to="/livraison" className="hover:text-gray-900">
                Expédition & Livraison
              </Link>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Informations légales</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <Link to="/a-propos" className="hover:text-gray-900">
                À propos de nous
              </Link>
              <Link to="/mentions-legales" className="hover:text-gray-900">
                Mentions légales
              </Link>
              <Link to="/cgv" className="hover:text-gray-900">
                CGV & Retours
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © 2026 KOKTEK. Tous droits réservés. koktek.com · Powered by YG.
        {buildLabel && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Build {buildLabel}
            {buildDateLabel ? ` · ${buildDateLabel}` : ''}
          </span>
        )}
      </div>
    </footer>
  )
}

export default Footer
