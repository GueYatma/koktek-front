import { useEffect, useState } from 'react'
import { LogOut, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import { getOrdersForEmail, type StoredOrder } from '../utils/customerOrders'
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

  const handleLogout = () => {
    logout()
    handleClose()
  }

  return (
    <div
      className={`fixed inset-0 z-[60] ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
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

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-8">
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
                    onChange={(event) => setFirstName(event.target.value)}
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
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Durand"
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                  Mes commandes
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Vos bons de commande sont conserves ici.
                </p>
              </div>
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                  Aucune commande enregistree pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setActiveOrder(order)}
                      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
                      aria-label={`Ouvrir le bon de commande ${order.orderNumber}`}
                    >
                      <div className="flex gap-3">
                        {order.imageUrl ? (
                          <img
                            src={resolveImageUrl(order.imageUrl)}
                            alt={order.productName}
                            className="h-16 w-16 rounded-xl object-contain bg-gray-50"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gray-400">
                            Bon de commande
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {order.productName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {order.variantName || 'Modele'} :{' '}
                            <span className="font-semibold text-gray-900">
                              {order.variantValue || '—'}
                            </span>
                          </p>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-gray-400">Total</span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(order.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                Retours
              </p>
              <p className="text-sm text-gray-500">
                Suivez vos retours et reclamations directement depuis cet espace.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-5 space-y-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Enregistrer mes informations
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Se deconnecter
          </button>
        </div>
      </aside>

      <OrderTicketModal
        open={Boolean(activeOrder)}
        onClose={() => setActiveOrder(null)}
        orderNumber={activeOrder?.orderNumber ?? ''}
        productName={activeOrder?.productName ?? 'Commande Koktek'}
        variantName={activeOrder?.variantName ?? null}
        variantValue={activeOrder?.variantValue ?? null}
        imageUrl={activeOrder?.imageUrl ?? null}
        customerName={
          activeOrder?.customerName ||
          [firstName, lastName].filter(Boolean).join(' ') ||
          user?.email ||
          null
        }
        total={activeOrder?.total ?? 0}
      />
    </div>
  )
}

export default ProfileDrawer
