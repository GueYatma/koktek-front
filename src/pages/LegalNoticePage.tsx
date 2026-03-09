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

      {/* RGPD */}
      <div className="mt-12 space-y-8 text-base leading-relaxed text-gray-700">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Politique de Confidentialité et Protection des Données (RGPD)
          </h2>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Collecte des données personnelles</h3>
          <p>
            Dans le cadre de l'utilisation du site KOKTEK et du traitement des commandes, nous sommes amenés à collecter
            des données personnelles vous concernant (nom, prénom, adresse postale, adresse e-mail, numéro de téléphone).
            Ces données sont strictement nécessaires au traitement de vos commandes, à la livraison des produits et à la
            gestion de la relation client.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Partage des données</h3>
          <p className="mb-3">
            Vos données ne sont jamais vendues à des tiers. Elles sont uniquement partagées avec nos partenaires de
            confiance dans le but exclusif d'exécuter votre commande :
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Nos prestataires de paiement (Stripe)</strong> pour la sécurisation de vos transactions.
              (KOKTEK ne stocke aucune donnée bancaire).
            </li>
            <li>
              <strong>Nos partenaires logistiques et transporteurs</strong> pour assurer l'expédition et le suivi de vos
              colis.
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookies</h3>
          <p>
            Le site KOKTEK utilise des cookies fonctionnels nécessaires au bon fonctionnement de la boutique (panier
            d'achat, session utilisateur). En naviguant sur ce site, vous acceptez l'utilisation de ces cookies.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vos droits (Accès, Modification, Suppression)
          </h3>
          <p>
            Conformément à la loi "Informatique et Libertés" et au Règlement Général sur la Protection des Données
            (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données
            personnelles.
          </p>
          <p className="mt-3">
            Pour exercer ces droits, il vous suffit de nous contacter par e-mail à l'adresse suivante :{' '}
            <a href="mailto:contact@koktek.com" className="font-semibold text-gray-900 underline underline-offset-2 hover:text-indigo-600 transition-colors">
              contact@koktek.com
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LegalNoticePage
