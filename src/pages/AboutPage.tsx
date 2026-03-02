import BackButton from '../components/BackButton'

const AboutPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-start gap-4">
        <BackButton fallback="/" className="mt-1 shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">KOKTEK</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900">
            À propos de nous
          </h1>
        </div>
      </div>
      <div className="mt-8 space-y-4 text-base leading-relaxed text-gray-700">
        <p>
          Bienvenue chez KOKTEK ! Nous sommes des passionnés de tech et
          d'accessoires mobiles. Notre mission est simple : vous proposer les
          meilleures protections pour votre smartphone au meilleur prix.
        </p>
        <p>
          Plus qu'une simple boutique en ligne, nous sommes un commerce de proximité :
          retrouvez-nous régulièrement sur nos stands sur les marchés de la région (selon nos emplacements).
          Notre équipe se fera un plaisir de vous conseiller en direct.
        </p>
      </div>
    </div>
  )
}

export default AboutPage
