import { Link } from 'react-router-dom'

const JournalFooter = () => {
  return (
    <footer className="relative border-t border-slate-200 bg-[#0f1c2d] text-slate-100 dark:border-slate-800 dark:bg-[#07101c]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-slate-400">
            Journal KOKTEK
          </p>
          <h2 className="font-journal-display mt-3 text-3xl leading-tight text-white">
            Un media de marque pour guider, inspirer et seulement ensuite recommander.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
            Guides pratiques, selections utiles et actualites a l intersection entre smartphone,
            mobilite, lifestyle et usage reel.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Thématiques</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <Link to="/blog/theme/auto-mobilite" className="transition hover:text-white">Auto & Mobilite</Link>
            <Link to="/blog/theme/tech-productivite" className="transition hover:text-white">Tech & Productivite</Link>
            <Link to="/blog/theme/lifestyle-protection" className="transition hover:text-white">Lifestyle & Protection</Link>
            <Link to="/blog/theme/guides-achat" className="transition hover:text-white">Guides d Achat</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">KOKTEK</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <Link to="/" className="transition hover:text-white">Accueil</Link>
            <Link to="/catalogue" className="transition hover:text-white">Boutique</Link>
            <Link to="/a-propos" className="transition hover:text-white">A propos</Link>
            <Link to="/mentions-legales" className="transition hover:text-white">Mentions legales</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 KOKTEK. Journal editorial et boutique reliee.</p>
          <p>Le journal reste dans la marque, mais change d ambiance.</p>
        </div>
      </div>
    </footer>
  )
}

export default JournalFooter
