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
    <footer className="mt-0 border-t border-gray-200 bg-gradient-to-b from-gray-200 via-gray-250 to-gray-300 pb-24 md:pb-0">
      <div className="w-full bg-gray-800/85">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:py-7">
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-8 lg:max-w-5xl lg:mx-auto">
            <div
              className="relative w-full min-h-[175px] overflow-hidden rounded-3xl bg-cover bg-top lg:min-h-[200px] lg:rounded-[22px] lg:bg-center"
              style={{
                backgroundImage: `url(${footerImage})`,
                backgroundPosition: 'center 18%',
              }}
            />

            <div className="space-y-3 lg:space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-gray-900 shadow-sm sm:text-sm">
                <ul className="list-disc space-y-1 leading-snug pl-5">
                  <li>Commandez sur le site.</li>
                  <li>Payez en espèces au stand.</li>
                  <li>Recevez votre article à domicile.</li>
                  <li>Retour et remboursement faciles au stand.</li>
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-700 lg:text-[13px]">
                <a
                  href="tel:+33758775291"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-900 bg-gray-900 px-2.5 py-1.5 text-white shadow-sm transition hover:bg-black hover:text-white lg:px-3 lg:py-2"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Appeler
                </a>
                <a
                  href="https://wa.me/33758775291"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 shadow-sm transition hover:border-gray-400 hover:text-gray-900 lg:px-3 lg:py-2"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
                <a
                  href="https://t.me/koktek_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-300 bg-white px-2.5 py-1.5 text-gray-800 shadow-sm transition hover:border-gray-400 hover:text-gray-900 lg:px-3 lg:py-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 border-t border-gray-300 bg-gray-900/90 px-4 py-8 text-gray-100 sm:px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-3 gap-4 sm:gap-8 sm:grid-cols-3 text-[12.5px] sm:text-base leading-snug">
          <div>
            <p className="text-xs font-semibold text-gray-100 sm:text-base sm:text-sm">Boutique</p>
            <div className="mt-1.5 flex flex-col gap-1.25 text-gray-200 sm:mt-2 sm:gap-1.5">
              <Link to="/" className="hover:text-white">
                Accueil
              </Link>
              <Link to="/catalogue" className="hover:text-white">
                Catalogue
              </Link>
              <Link to="/catalogue?search=nouveautes" className="hover:text-white">
                Nouveautés
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-100 sm:text-base sm:text-sm">Service Client</p>
            <div className="mt-1.5 flex flex-col gap-1.25 text-gray-200 sm:mt-2 sm:gap-1.5">
              <button
                type="button"
                onClick={openContact}
                className="text-left transition hover:text-white"
              >
                Contact
              </button>
              <Link to="/livraison" className="hover:text-white">
                Expédition & Livraison
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-100 sm:text-base sm:text-sm">Informations légales</p>
            <div className="mt-1.5 flex flex-col gap-1.25 text-gray-200 sm:mt-2 sm:gap-1.5">
              <Link to="/a-propos" className="hover:text-white">
                À propos de nous
              </Link>
              <Link to="/mentions-legales" className="hover:text-white">
                Mentions légales
              </Link>
              <Link to="/cgv" className="hover:text-white">
                CGV & Retours
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4 text-center text-xs text-gray-400 sm:text-sm">
          © 2026 KOKTEK. Tous droits réservés. koktek.com · Powered by YG.
          {buildLabel && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300">
              Build {buildLabel}
              {buildDateLabel ? ` · ${buildDateLabel}` : ''}
            </span>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer
