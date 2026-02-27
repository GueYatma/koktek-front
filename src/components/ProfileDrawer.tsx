import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import { getOrdersForEmail, type StoredOrder } from '../utils/customerOrders'
import OrderTicketModal from './OrderTicketModal'

type ProfileDrawerProps = {
  open: boolean
  onClose: () => void
}

const ProfileDrawer = ({ open, onClose }: ProfileDrawerProps) => {
  const { user, updateProfile } = useAuth()
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
    setOrders(getOrdersForEmail(user.email))
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
    if (paymentStatus === 'paid') {
      return {
        label: 'Voir mon Ticket de paiement',
        headerLabel: 'REÇU / PAYÉ',
        title: 'Paiement confirmé',
        noticeTone: 'success' as const,
        noticeText:
          'Paiement confirmé. Merci, votre commande est en cours de préparation.',
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

  return (
    <div
      className={`fixed inset-0 z-[60] ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 backdrop-blur-sm bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
        <div
          role="dialog"
          aria-modal="true"
          className={`relative flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300 sm:max-w-md ${
            open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'
          }`}
          style={{ maxHeight: '85vh' }}
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

          <div className="flex-1 overflow-y-auto px-4 py-4">
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
                                {order.payment_status ?? order.status ?? '—'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveOrder(order)}
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
            <div className="border-t border-gray-200 px-4 py-4">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Mettre à jour mon profil
              </button>
            </div>
          )}
        </div>
      </div>

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
      />
    </div>
  )
}

export default ProfileDrawer
