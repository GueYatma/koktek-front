import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import { getCustomerOrdersByEmail } from '../lib/commerceApi'
import { getOrdersForEmail, saveOrderForEmail, type StoredOrder } from '../utils/customerOrders'
import OrderTicketModal from './OrderTicketModal'

type ProfileDrawerProps = {
  open: boolean
  onClose: () => void
}

const ProfileDrawer = ({ open, onClose }: ProfileDrawerProps) => {
  const { user, updateProfile, logout } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [zip, setZip] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('France')
  const [orders, setOrders] = useState<StoredOrder[]>([])
  const [activeOrder, setActiveOrder] = useState<StoredOrder | null>(null)
  
  const { activeProfileTab, openProfile } = useUI()

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName ?? '')
    setLastName(user.lastName ?? '')
    setPhone(user.phone ?? '')
    setAddressLine1(user.addressLine1 ?? '')
    setAddressLine2(user.addressLine2 ?? '')
    setZip(user.zip ?? '')
    setCity(user.city ?? '')
    setCountry(user.country ?? 'France')
  }, [user, open])

  useEffect(() => {
    if (!user?.email || !open) {
      setOrders([])
      return
    }
    // 1. Initialiser avec le cache local immédiatement
    setOrders(getOrdersForEmail(user.email))

    // 2. Récupérer les données réelles (tracking) en arrière-plan
    const syncOrders = async () => {
      try {
        const remoteOrders = await getCustomerOrdersByEmail(user.email!)
        const localOrders = getOrdersForEmail(user.email!)
        let hasChanges = false

        remoteOrders.forEach((remoteOrder) => {
          // Chercher par order_number (ex: KOK-...) ou id
          const localMatch = localOrders.find(
            (l) => l.orderNumber === remoteOrder.order_number || l.id === remoteOrder.id
          )
          if (localMatch) {
            localMatch.status = remoteOrder.status
            localMatch.payment_status = remoteOrder.payment_status
            localMatch.logisticName = remoteOrder.logistic_name
            localMatch.trackingNumber = remoteOrder.tracking_number
            localMatch.trackingUrl = remoteOrder.tracking_url
            localMatch.deliveryTimeEstimation = remoteOrder.delivery_time_estimation
            saveOrderForEmail(user.email!, localMatch)
            hasChanges = true
          }
        })

        if (hasChanges) {
          // Rafraîchir l'affichage avec les données mises à jour
          setOrders(getOrdersForEmail(user.email!))
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation des commandes', error)
      }
    }
    syncOrders()
  }, [user, open])

  const handleSave = () => {
    updateProfile({
      firstName,
      lastName,
      phone,
      addressLine1,
      addressLine2,
      zip,
      city,
      country,
    })
  }

  const handleClose = () => {
    setActiveOrder(null)
    onClose()
  }

  const handleLogout = () => {
    logout()
    handleClose()
    window.location.reload()
  }

  const formatOrderDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return value
    }
  }

  const resolveOrderAction = (order: StoredOrder) => {
    const paymentStatus = order.payment_status ?? order.status ?? ''
    const logisticStatus = order.status ?? ''

    // Si la commande est expédiée ou livrée, peu importe le moyen de paiement,
    // on ne la considère plus 'pending', on affiche le ticket final avec tracking.
    if (logisticStatus === 'shipped' || logisticStatus === 'delivered' || paymentStatus === 'paid') {
      return {
        label: 'Voir mon Ticket et Suivi',
        headerLabel: logisticStatus === 'shipped' ? 'EXPÉDIÉ' : 'REÇU / PAYÉ',
        title: logisticStatus === 'shipped' ? 'Commande expédiée !' : 'Paiement confirmé',
        noticeTone: 'success' as const,
        noticeText: logisticStatus === 'shipped'
          ? 'Bonne nouvelle, votre commande est en route ! Consultez les détails de livraison ci-dessous.'
          : 'Paiement confirmé. Merci, votre commande est en cours de préparation.',
      }
    }

    if (paymentStatus === 'pending_cash') {
      return {
        label: 'Voir mon Bon de Commande',
        headerLabel: 'BON DE COMMANDE',
        title: 'Commande Réservée !',
        noticeTone: 'danger' as const,
        noticeText:
          'Votre commande sera préparée uniquement après réception de votre paiement en espèces dans notre boutique à Marseille.',
      }
    }

    return {
      label: 'Voir mon Bon de Commande',
      headerLabel: 'BON DE COMMANDE',
      title: 'Commande enregistrée',
      noticeTone: 'danger' as const,
      noticeText:
        'Votre commande sera préparée uniquement après réception du paiement.',
    }
  }

  const displayStatus = (order: StoredOrder) => {
    if (order.status === 'shipped') return '📦 Expédié'
    if (order.status === 'canceled' || order.payment_status === 'canceled') return '❌ Annulé'
    if (order.payment_status === 'paid') return '⏳ En préparation'
    if (order.payment_status === 'pending_cash') return '⏳ Attente paiement boutique'
    return order.payment_status ?? order.status ?? '—'
  }

  return (
    <div
      className={`fixed inset-0 z-[60] transition-[visibility,opacity] duration-300 ease-out ${
        open ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed top-[10%] bottom-[10%] left-4 right-4 flex h-auto max-h-[80vh] w-auto flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-[transform,opacity] duration-300 ease-out will-change-[transform,opacity] md:bottom-auto md:left-auto md:right-0 md:top-0 md:h-full md:max-h-none md:max-w-md md:rounded-none ${
          open ? 'translate-y-0 opacity-100 md:translate-x-0 md:translate-y-0' : 'translate-y-8 opacity-0 md:translate-x-full md:translate-y-0 md:opacity-100'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-500">
                Mon Espace KOKTEK
              </p>
              <h2 className="text-lg font-bold text-gray-900">
                Bonjour, {user?.email ?? 'Client'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-y-contain px-4 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openProfile('orders')}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeProfileTab === 'orders'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Mes Commandes
              </button>
              <button
                type="button"
                onClick={() => openProfile('profile')}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activeProfileTab === 'profile'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                Mon Profil
              </button>
            </div>

            {activeProfileTab === 'profile' ? (
              <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                      Informations personnelles
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Prenom
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(event) =>
                            setFirstName(event.target.value)
                          }
                          placeholder="Camille"
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Nom
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(event) =>
                            setLastName(event.target.value)
                          }
                          placeholder="Durand"
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                      Retours
                    </p>
                    <p className="text-sm text-gray-500">
                      Suivez vos retours et reclamations directement depuis cet
                      espace.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Livraison *
                  </p>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Telephone mobile *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="06 12 34 56 78"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Adresse *
                    </label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(event) => setAddressLine1(event.target.value)}
                      placeholder="12 Rue de la Paix"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Complement
                    </label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(event) => setAddressLine2(event.target.value)}
                      placeholder="Batiment, etage, interphone..."
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Code postal *
                      </label>
                      <input
                        type="text"
                        value={zip}
                        onChange={(event) => setZip(event.target.value)}
                        placeholder="75008"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Ville *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        placeholder="Paris"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Pays
                    </label>
                    <select
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                    >
                      <option value="France">France</option>
                      <option value="Belgique">Belgique</option>
                      <option value="Suisse">Suisse</option>
                      <option value="Luxembourg">Luxembourg</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Historique de mes commandes
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Retrouvez vos achats et vos tickets de paiement.
                  </p>
                </div>
                {orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                    Aucune commande enregistree pour le moment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const action = resolveOrderAction(order)
                      return (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {order.imageUrl ? (
                                <img
                                  src={resolveImageUrl(order.imageUrl)}
                                  alt={order.productName}
                                  loading="lazy"
                                  decoding="async"
                                  className="h-16 w-16 rounded-xl object-contain bg-gray-50"
                                />
                              ) : null}
                              <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                                  {formatOrderDate(order.createdAt)}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                  {order.orderNumber}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {order.productName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Montant</p>
                              <p className="text-lg font-semibold text-gray-900">
                                {formatPrice(order.total)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-gray-500">
                              Statut:{' '}
                              <span className="font-semibold text-gray-900">
                                {displayStatus(order)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                console.log('STATUT REÇU:', order.status, 'PAIEMENT REÇU:', order.payment_status)
                                setActiveOrder(order)
                              }}
                              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                            >
                              {action.label}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          {activeProfileTab === 'profile' && (
            <div className="border-t border-gray-200 px-4 py-4 space-y-3">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Mettre à jour mon profil
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 hover:text-red-600"
              >
                Se déconnecter
              </button>
            </div>
          )}
      </aside>

      <OrderTicketModal
        open={Boolean(activeOrder)}
        onClose={() => setActiveOrder(null)}
        orderNumber={activeOrder?.orderNumber ?? ''}
        productName={activeOrder?.productName ?? 'Commande Koktek'}
        variantName={activeOrder?.variantName ?? null}
        variantValue={activeOrder?.variantValue ?? null}
        sku={activeOrder?.sku ?? null}
        imageUrl={activeOrder?.imageUrl ?? null}
        customerName={
          activeOrder?.customerName ||
          [firstName, lastName].filter(Boolean).join(' ') ||
          user?.email ||
          null
        }
        total={activeOrder?.total ?? 0}
        headerLabel={
          activeOrder ? resolveOrderAction(activeOrder).headerLabel : undefined
        }
        title={activeOrder ? resolveOrderAction(activeOrder).title : undefined}
        noticeText={
          activeOrder ? resolveOrderAction(activeOrder).noticeText : undefined
        }
        noticeTone={
          activeOrder ? resolveOrderAction(activeOrder).noticeTone : undefined
        }
        status={activeOrder?.status ?? null}
        logisticName={activeOrder?.logisticName ?? null}
        trackingNumber={activeOrder?.trackingNumber ?? null}
        trackingUrl={activeOrder?.trackingUrl ?? null}
        deliveryTimeEstimation={activeOrder?.deliveryTimeEstimation ?? null}
      />
    </div>
  )
}

export default ProfileDrawer
