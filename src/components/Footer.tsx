import { Link } from 'react-router-dom'
import { MessageCircle, Phone, Send } from 'lucide-react'
import { useUI } from '../context/UIContext'

type FooterProps = {
  buildLabel?: string
  buildDateLabel?: string
}

const Footer = ({ buildLabel, buildDateLabel }: FooterProps) => {
  const { openContact } = useUI()

  const footerImage = '/footer-stand.webp'

  return (
    <footer className="w-full">
      {/* SECTION 1: BANDE BLANCHE (CTA + CARTE DE VISITE) */}
      <div className="w-full bg-white border-b border-t border-gray-200 py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-10">
            {/* CTA Header Level */}
            <div className="mx-auto w-full max-w-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 bg-[#fafafa] border border-gray-200/80 p-4 sm:px-6 sm:py-5 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] relative z-10 transition-transform hover:-translate-y-1">
               <div className="text-center sm:text-left">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">Besoin d'aide ou d'un conseil ?</h2>
                  <p className="text-[12px] sm:text-[13px] text-gray-600 font-medium tracking-wide">Notre équipe est à votre écoute pour vous accompagner.</p>
               </div>
               <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 w-full sm:w-auto shrink-0">
                  <a
                    href="tel:+33758775291"
                    className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-black hover:shadow-md active:scale-[0.98] whitespace-nowrap"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Appeler
                  </a>
                  <a
                    href="https://wa.me/33758775291"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-800 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] whitespace-nowrap"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                    WhatsApp
                  </a>
                  <a
                    href="https://t.me/koktek_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-800 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] whitespace-nowrap"
                  >
                    <Send className="h-3.5 w-3.5 text-blue-500" />
                    Telegram
                  </a>
               </div>
            </div>

            {/* Business Cards Level */}
            <div className="pt-6 sm:pt-8 w-full">
               
               {/* SINGLE CARD (RECTO) */}
               <div className="group relative aspect-auto sm:aspect-[85/55] w-full max-w-[32rem] lg:max-w-[34rem] mx-auto rounded-[20px] sm:rounded-3xl border-[1.5px] border-[#1f2937] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden transition-transform hover:-translate-y-1.5 lg:hover:-translate-y-2">

                 {/* WALLET TRICK: Vertical Band on the Right (SAFE MARGINS PRINT) */}
                 <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-12 bg-[#fafafa] border-l border-gray-100 flex items-center justify-center z-10 overflow-hidden">
                    <div className="absolute whitespace-nowrap rotate-90 flex items-center gap-2 text-[7.5px] sm:text-[8.5px] font-bold tracking-widest text-gray-800 uppercase origin-center px-6">
                       <span className="font-nunito font-bold text-[10.5px] sm:text-[12px] tracking-tight text-slate-900">KOKTEK</span>
                       <span className="font-nunito">— COMMANDEZ EN LIGNE — PAYEZ EN ESPÈCES</span>
                    </div>
                 </div>

                 {/* MAIN CARD CONTENT */}
                 <div className="flex-grow flex flex-col p-5 sm:p-8 pr-12 sm:pr-16 relative z-20 w-full h-full">
                   
                   {/* Header Area */}
                   <div className="flex justify-between items-start w-full">
                     <div className="flex flex-col items-start pt-1">
                       {/* LOGO KOKTEK -12%, color #0f172a, font-bold */}
                       <h4 className="font-nunito text-[38px] sm:text-[46px] leading-[0.85] font-bold tracking-tight text-[#0f172a] uppercase drop-shadow-sm">
                         KOKTEK
                       </h4>
                       {/* BADGE ACCESSOIRES : style hérité de koktek.com pour cohérence parfaite */}
                       <div className="mt-2 inline-flex items-center rounded-xl bg-gray-200 px-2.5 py-1 border border-gray-300 shadow-md">
                         <span className="font-nunito text-[8.5px] sm:text-[9.5px] font-extrabold tracking-[0.12em] text-gray-900 uppercase drop-shadow-sm">
                           Accessoires smartphone
                         </span>
                       </div>
                     </div>
                     
                     {/* QR Code */}
                     <div className="shrink-0 bg-white p-2 rounded-xl border-[2px] border-[#111] shadow-md relative z-10 mr-1 sm:mr-1.5">
                       <img 
                         src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=https%3A%2F%2Fkoktek.com%2Fcatalogue" 
                         alt="Catalogue KOKTEK" 
                         className="w-16 h-16 sm:w-20 sm:h-20"
                         crossOrigin="anonymous"
                       />
                     </div>
                   </div>

                   {/* --- BOTTOM GROUP (Slogan + Contacts) LIFTED BY 3MM (pb-3 sm:pb-4 = 12-16px) --- */}
                   <div className="mt-auto flex flex-col w-full pb-3 sm:pb-4">
                     
                     {/* Slogan & Website Area (aéré en bas avec mb-4 pour la respiration au-dessus de la ligne orange) */}
                     <div className="flex flex-col gap-4 sm:gap-5 mb-4 sm:mb-5">
                       
                       {/* 1. koktek.com badge */}
                       <div className="w-full flex items-center justify-center">
                         <div className="inline-flex items-center rounded-xl bg-gray-200 px-6 py-2 sm:py-2.5 border border-gray-300 shadow-md">
                           <span className="font-nunito text-[18px] sm:text-[20px] font-bold tracking-wide text-gray-900 lowercase drop-shadow-sm">
                             koktek.com
                           </span>
                         </div>
                       </div>

                       {/* 2. 3 Bullets Slogan */}
                       <div className="font-nunito flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-2.5 px-0.5 sm:px-1 mt-1 sm:mt-2">
                         <div className="flex items-center gap-2">
                           <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                           <span className="text-[10px] sm:text-[11.5px] font-bold text-gray-800">Commandez en ligne</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                           <span className="text-[10px] sm:text-[11.5px] font-bold text-gray-800">Payez en espèces</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                           <span className="text-[10px] sm:text-[11.5px] font-bold text-gray-800">Retours faciles</span>
                         </div>
                       </div>
                     </div>

                     {/* Contacts + Promo Area (statique en bas) */}
                     <div className="flex flex-col w-full text-center">
                       
                       {/* Orange Separator 1 */}
                       <div className="h-[1.5px] w-full bg-orange-500 mx-auto mb-3 opacity-80 rounded-full" />

                       {/* Contacts Row */}
                       <div className="font-nunito flex flex-wrap items-center justify-between text-[10px] sm:text-[11.5px] font-semibold text-gray-700 w-full px-1 mb-3">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900 tracking-wide">
                             koktek.com
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> <span>07 58 77 52 91</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-blue-500" /> Telegram
                          </div>
                       </div>

                       {/* Orange Separator 2 */}
                       <div className="h-[1.5px] w-full bg-orange-500 mx-auto mb-3 opacity-80 rounded-full" />
                       
                       {/* Promo Phrase (Majuscule, nowrap 1 ligne) */}
                       <p className="font-nunito text-[10.5px] sm:text-[11.5px] font-medium text-gray-700 tracking-wide mb-1 whitespace-nowrap overflow-hidden px-1">
                         Demandez votre code promo sur koktek.com via le formulaire de contact.
                       </p>

                     </div>
                   </div>

                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PHOTO + ENCART BLANC */}
      <div className="w-full bg-gradient-to-b from-gray-200 via-gray-250 to-gray-300 pb-24 md:pb-0">
        <div className="w-full bg-gray-800/85">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
            <div className="grid gap-6 md:grid-cols-2 md:items-stretch lg:gap-8 lg:max-w-4xl lg:mx-auto">
              
              <div className="relative w-full h-[250px] md:h-auto overflow-hidden rounded-[22px] lg:rounded-3xl shadow-sm">
                <img
                  src={footerImage}
                  alt="Stand Koktek"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: 'center 18%' }}
                />
              </div>

              <div className="flex flex-col justify-center rounded-[22px] lg:rounded-3xl border border-gray-200 bg-white px-6 py-8 md:p-8 shadow-sm">
                <p className="text-lg lg:text-xl font-bold text-gray-950 mb-5">Un vrai commerce derrière le site</p>
                <ul className="list-none space-y-3.5 mb-6">
                  <li className="flex items-start gap-2.5">
                     <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                     <span className="text-sm font-medium leading-snug text-gray-800">Boutique en ligne + présence sur les marchés (stand KOKTEK).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                     <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                     <span className="text-sm font-medium leading-snug text-gray-800">Paiement au choix : carte bancaire en ligne ou espèces au stand.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                     <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                     <span className="text-sm font-medium leading-snug text-gray-800">Livraison à domicile partout.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                     <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                     <span className="text-sm font-medium leading-snug text-gray-800">Retours simples : au stand ou par courrier.</span>
                  </li>
                </ul>
                <p className="text-[13px] font-semibold italic text-gray-500 mb-0">"Chez KOKTEK, vous savez toujours à qui vous achetez."</p>
              </div>

            </div>
          </div>
        </div>

        {/* SECTION 3: LIENS FOOTER SOMBRE */}
        <div className="border-t border-gray-300 bg-gray-900/90 px-4 py-8 text-gray-100 sm:px-6">
          <div className="mx-auto max-w-6xl grid grid-cols-2 gap-8 sm:gap-8 sm:grid-cols-3 text-[12.5px] sm:text-sm leading-snug">
            <div>
              <p className="text-xs font-semibold text-gray-100 sm:text-sm">Boutique</p>
              <div className="mt-2.5 flex flex-col gap-2 text-gray-300">
                <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
                <Link to="/catalogue" className="hover:text-white transition-colors">Catalogue</Link>
                <Link to="/catalogue?search=nouveautes" className="hover:text-white transition-colors">Nouveautés</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-100 sm:text-sm">Service Client</p>
              <div className="mt-2.5 flex flex-col gap-2 text-gray-300">
                <button
                  type="button"
                  onClick={openContact}
                  className="text-left hover:text-white transition-colors"
                >
                  Contact
                </button>
                <Link to="/livraison" className="hover:text-white transition-colors">Expédition & Livraison</Link>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 border-t border-gray-800 pt-6 sm:border-t-0 sm:pt-0">
              <p className="text-xs font-semibold text-gray-100 sm:text-sm">Informations légales</p>
              <div className="mt-2.5 flex flex-col gap-2 text-gray-300">
                <Link to="/a-propos" className="hover:text-white transition-colors">À propos de nous</Link>
                <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
                <Link to="/cgv" className="hover:text-white transition-colors">CGV & Retours</Link>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-6xl mt-8 border-t border-gray-800 pt-5 text-center text-xs text-gray-400">
            © 2026 KOKTEK. Tous droits réservés. koktek.com · Powered by YG.
            {buildLabel && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                Build {buildLabel}
                {buildDateLabel ? ` · ${buildDateLabel}` : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
