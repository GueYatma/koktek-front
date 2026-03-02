import BackButton from '../components/BackButton'

const ShippingPage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-start gap-4">
        <BackButton fallback="/" className="mt-1 shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">KOKTEK</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900">
            Expédition & Livraison
          </h1>
        </div>
      </div>
      <div className="mt-8 space-y-4 text-base leading-relaxed text-gray-700">
        <p>
          Chez KOKTEK, nous faisons le maximum pour que vous receviez vos
          accessoires rapidement.
        </p>
        <p>
          Délais de livraison : Toutes nos commandes sont traitées avec soin et
          expédiées pour une livraison estimée entre 5 et 7 jours ouvrés.
        </p>
        <p>
          Suivi : Dès que votre commande est expédiée, vous recevez un e-mail
          avec un numéro vous permettant de suivre votre colis.
        </p>
      </div>
    </div>
  )
}

export default ShippingPage
