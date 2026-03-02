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

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Politique de retour et remboursement
          </h2>
          <p>
            Vous disposez de 14 jours à compter de la réception de votre commande pour demander un retour.
          </p>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Conditions de retour</h3>
            <p>Pour être éligible au remboursement :</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>L’article doit être neuf, non utilisé et non endommagé</li>
              <li>Il doit être retourné dans son emballage d’origine</li>
              <li>Toutes les informations de livraison doivent être présentes</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Modes de retour</h3>
            <p className="mb-2">Vous avez deux possibilités :</p>
            
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <strong className="block text-indigo-900 mb-1">1) Retour au stand KOKTEK (recommandé)</strong>
              <p className="text-indigo-800 mb-0">
                Vous pouvez remettre l’article directement à notre stand lors de nos présences sur les marchés. Le remboursement pourra être effectué immédiatement selon le mode de paiement initial.
              </p>
            </div>
            
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mt-3">
              <strong className="block text-gray-900 mb-1">2) Retour par courrier</strong>
              <p className="text-gray-700 mb-2">Vous pouvez renvoyer l’article à l’adresse suivante :</p>
              <address className="not-italic font-medium text-gray-800 bg-white p-3 rounded-lg border border-gray-100 mb-2">
                KOKTEK – YG<br />
                9 rue d’Orange<br />
                13003 Marseille – France
              </address>
              <p className="text-sm text-gray-600 mb-0">Le remboursement est effectué après réception et vérification de l’article.</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Modalités de remboursement</h3>
            <ul className="list-none space-y-2 pl-0">
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />Paiement par carte → remboursement sur la carte utilisée</li>
              <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />Paiement en espèces → remboursement en espèces au stand</li>
            </ul>
            <p className="text-sm italic font-medium text-amber-700 mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              Aucun remboursement en espèces ne peut être envoyé par voie postale.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
