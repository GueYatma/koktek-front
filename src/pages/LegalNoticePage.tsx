import BackButton from '../components/BackButton'

const LegalNoticePage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-start gap-4">
        <BackButton fallback="/" className="mt-1 shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">KOKTEK</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900">
            Mentions légales
          </h1>
        </div>
      </div>
      <div className="mt-8 space-y-4 text-base leading-relaxed text-gray-700">
        <p>
          Le présent site web est édité par Fonkaz (YG), immatriculée au Registre
          du Commerce et des Sociétés sous le numéro de SIRET 801392697 00026,
          dont le siège social est situé au 9 rue d'Orange, 13003 Marseille.
          Directeur de la publication : YG. Hébergement du site assuré par :
          Hostinger.
        </p>
        <p>
          Pour toute question, notre service client est joignable par e-mail à
          l'adresse suivante : contact@koktek.com, ou par téléphone au 07 58 77
          52 91.
        </p>
      </div>
    </div>
  )
}

export default LegalNoticePage
