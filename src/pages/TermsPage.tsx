import BackButton from '../components/BackButton'

const TermsPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-start gap-4">
        <BackButton fallback="/" className="mt-1 shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">KOKTEK</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900">
            CGV, Paiements & Retours
          </h1>
        </div>
      </div>
      <div className="mt-8 space-y-6 text-base leading-relaxed text-gray-700">
        <p>Nous vous offrons une flexibilité totale sur vos achats.</p>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Moyens de paiement :
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Carte Bancaire : Paiement 100% sécurisé en ligne.</li>
            <li>
              Espèces (Notre spécialité) : Vous avez la possibilité exclusive de
              commander en ligne et de régler vos achats en espèces directement
              sur l'un de nos stands !
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Politique de Retour et Remboursement :
          </h2>
          <p>
            Vous disposez de 14 jours pour nous retourner un article dans son
            emballage d'origine. Les remboursements suivent le même canal que
            votre paiement initial :
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Achat par Carte Bancaire : Le remboursement sera recrédité sur la
              carte bancaire utilisée.
            </li>
            <li>
              Achat en Espèces : Tout achat réglé en espèces sera remboursé
              exclusivement en espèces. Ce remboursement s'effectuera en main
              propre, directement au comptoir de notre stand sur présentation du
              ticket de paiement numérique ou de la facture. Aucun remboursement
              en espèces ne pourra être envoyé par voie postale.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
