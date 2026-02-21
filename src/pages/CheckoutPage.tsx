import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import { saveOrderForEmail } from '../utils/customerOrders'
import OrderTicketModal from '../components/OrderTicketModal'
import {
  createCustomer,
  createOrder,
  createOrderBilling,
  createOrderDelivery,
  createOrderItems,
  getCustomerByEmail,
  markOrderPaid,
} from '../lib/commerceApi'

const N8N_WEBHOOK_URL =
  'https://n8n.srv747988.hstgr.cloud/webhook/koktek-paiement-especes'

type CheckoutStep = 'form' | 'payment' | 'success'
type PaymentView = 'choice' | 'card'

type DeliveryFormState = {
  first_name: string
  last_name: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  postal_code: string
  city: string
  region: string
  country: string
}

type BillingFormState = {
  first_name: string
  last_name: string
  company_name: string
  tax_id: string
  email: string
  phone: string
  address_line1: string
  address_line2: string
  postal_code: string
  city: string
  region: string
  country: string
}

const CheckoutPage = () => {
  const { items, total, itemCount, clearCart, cartId } = useCart()
  const { user, login, updateProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPayingCash, setIsPayingCash] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [billingDifferent, setBillingDifferent] = useState(false)
  const [hoveredBtn, setHoveredBtn] = useState<'card' | 'cash' | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [paymentView, setPaymentView] = useState<PaymentView>('choice')
  const checkoutStepRef = useRef<CheckoutStep>(checkoutStep)
  const [customerSnapshot, setCustomerSnapshot] = useState<{
    email: string
    first_name: string
    last_name: string
    zip_code: string
    country_code: string
  } | null>(null)

  const [delivery, setDelivery] = useState<DeliveryFormState>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    city: '',
    region: '',
    country: '',
  })

  const [billing, setBilling] = useState<BillingFormState>({
    first_name: '',
    last_name: '',
    company_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    city: '',
    region: '',
    country: '',
  })

  const ticketOrderNumber = orderNumber ?? orderId ?? ''
  const ticketMainItem = items[0]
  const ticketProductName = ticketMainItem
    ? ticketMainItem.product.title
    : 'Commande Koktek'
  const ticketImageUrl = ticketMainItem
    ? resolveImageUrl(ticketMainItem.product.image_url)
    : ''
  const ticketVariantName = ticketMainItem?.variant.option1_name?.trim()
  const ticketVariantValue =
    ticketMainItem?.variant.option1_value?.trim() || '—'
  const ticketCustomerName = [
    customerSnapshot?.first_name || delivery.first_name,
    customerSnapshot?.last_name || delivery.last_name,
  ]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    checkoutStepRef.current = checkoutStep
  }, [checkoutStep])

  useEffect(() => {
    return () => {
      if (checkoutStepRef.current === 'success') {
        clearCart()
      }
    }
  }, [clearCart])

  const resolveCountryCode = (value: string) => {
    const normalized = value.trim()
    if (!normalized) return normalized
    if (normalized.toLowerCase().includes('france')) return 'FR'
    if (normalized.length === 2) return normalized.toUpperCase()
    return normalized
  }

  const handlePaymentOnline = async () => {
    // TODO: Intégration Stripe à implémenter.
  }

  const handlePayCash = async () => {
    if (!orderId || isPayingCash) return
    setIsPayingCash(true)
    setError(null)

    try {
      const fallbackCustomer = {
        email: delivery.email.trim(),
        first_name: delivery.first_name.trim(),
        last_name: delivery.last_name.trim(),
        zip_code: delivery.postal_code.trim(),
        country_code: resolveCountryCode(delivery.country),
      }
      const customer = customerSnapshot ?? fallbackCustomer
      const itemsPayload = items.map((item) => ({
        name: item.product.title,
        quantity: item.quantity,
        price: item.variant.price,
        image_url: resolveImageUrl(item.product.image_url),
      }))
      const payload = {
        order_id: orderId,
        order_number: orderNumber ?? orderId,
        total_amount: total,
        customer,
        items: itemsPayload,
      }

      // Étape 1: passer la commande en attente de paiement espèces.
      await markOrderPaid(orderId, {
        status: 'pending_cash',
        payment_status: 'pending_cash',
        payment_reference: null,
      })

      // Étape 2: notifier le workflow externe via webhook.
      if (N8N_WEBHOOK_URL) {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Webhook n8n: envoi de l'ID de commande pour déclencher le process externe.
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Webhook n8n error')
        }
      }

      // Étape 3: afficher le message de succès.
      setCheckoutStep('success')
    } catch (payError) {
      console.error('Erreur paiement espèces', payError)
      setError("Impossible de valider le paiement en espèces. Réessaie.")
    } finally {
      setIsPayingCash(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (items.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    if (!cartId) {
      setError('Panier introuvable ou expiré')
      setIsSubmitting(false)
      return
    }

    try {
      // Étape 1: récupération/création du customer AVANT la commande.
      const customerEmail = (billingDifferent
        ? billing.email.trim()
        : delivery.email.trim()) || ''
      const countryCode = resolveCountryCode(delivery.country)
      const deliveryFullName = [delivery.first_name, delivery.last_name]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(' ')
      const billingFullName = [billing.first_name, billing.last_name]
        .map((value) => value.trim())
        .filter(Boolean)
        .join(' ')
      let customerId: string
      try {
        const existingCustomer = await getCustomerByEmail(customerEmail)
        if (existingCustomer?.id) {
          customerId = existingCustomer.id
        } else {
          const createdCustomer = await createCustomer({
            first_name: delivery.first_name.trim(),
            last_name: delivery.last_name.trim(),
            email: customerEmail,
            phone: delivery.phone.trim() || null,
            address_line1: delivery.address_line1.trim(),
            address_line2: delivery.address_line2.trim() || null,
            zip_code: delivery.postal_code.trim(),
            city: delivery.city.trim(),
            region: delivery.region.trim() || null,
            country_code: countryCode,
          })
          customerId = createdCustomer.id
        }
      } catch (customerError) {
        console.error('Erreur création client', customerError)
        throw customerError
      }

      // Étape 2: création de la commande (status pending_payment) avec customer_id.
      const order = await createOrder({
        cart_id: cartId,
        customer_id: customerId,
        status: 'pending_payment',
        currency: 'EUR',
        subtotal: total,
        total,
        item_count: itemCount,
      })

      // Étape 3: création des lignes de commande à partir du panier.
      await createOrderItems(
        items.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          variant_id: item.variant.id,
          quantity: item.quantity,
          unit_price: item.variant.price,
          line_total: item.variant.price * item.quantity,
          currency: 'EUR',
        })),
      )

      // Étape 4: création de la livraison.
      await createOrderDelivery({
        order_id: order.id,
        status: 'pending',
        recipient_name: deliveryFullName,
        email: delivery.email.trim(),
        phone: delivery.phone.trim() || null,
        address_line1: delivery.address_line1.trim(),
        address_line2: delivery.address_line2.trim() || null,
        postal_code: delivery.postal_code.trim(),
        city: delivery.city.trim(),
        region: delivery.region.trim() || null,
        country: delivery.country.trim(),
      })

      // Étape 5: création de la facturation uniquement si différente.
      if (billingDifferent) {
        await createOrderBilling({
          order_id: order.id,
          billing_name: billingFullName,
          company_name: billing.company_name.trim() || null,
          tax_id: billing.tax_id.trim() || null,
          email: billing.email.trim(),
          phone: billing.phone.trim() || null,
          address_line1: billing.address_line1.trim(),
          address_line2: billing.address_line2.trim() || null,
          postal_code: billing.postal_code.trim(),
          city: billing.city.trim(),
          region: billing.region.trim() || null,
          country: billing.country.trim(),
        })
      }

      // Étape 7: passage à l'étape de paiement.
      setOrderId(order.id)
      setOrderNumber(order.order_number ?? null)
      setPaymentView('choice')
      setCustomerSnapshot({
        email: customerEmail,
        first_name: delivery.first_name.trim(),
        last_name: delivery.last_name.trim(),
        zip_code: delivery.postal_code.trim(),
        country_code: countryCode,
      })
      if (customerEmail) {
        const mainItem = items[0]
        saveOrderForEmail(customerEmail, {
          id: order.id,
          orderNumber: order.order_number ?? order.id,
          total,
          productName: mainItem ? mainItem.product.title : 'Commande Koktek',
          variantName: mainItem?.variant.option1_name ?? null,
          variantValue: mainItem?.variant.option1_value ?? null,
          imageUrl: mainItem ? resolveImageUrl(mainItem.product.image_url) : null,
          customerName: deliveryFullName || null,
          createdAt: new Date().toISOString(),
        })
      }
      if (customerEmail && (!user || user.email !== customerEmail)) {
        await login(customerEmail)
      }
      if (customerEmail) {
        updateProfile({
          email: customerEmail,
          firstName: delivery.first_name.trim(),
          lastName: delivery.last_name.trim(),
          phone: delivery.phone.trim() || undefined,
          addressLine1: delivery.address_line1.trim(),
          addressLine2: delivery.address_line2.trim() || undefined,
          zip: delivery.postal_code.trim(),
          city: delivery.city.trim(),
          country: delivery.country.trim(),
        })
      }
      setCheckoutStep('payment')
    } catch (submitError) {
      console.error('Erreur checkout', submitError)
      setError("Une erreur est survenue lors de la validation de commande.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
          Paiement
        </p>
        <h1 className="text-3xl font-semibold text-gray-900">
          Finaliser la commande
        </h1>
      </div>

      {checkoutStep !== 'success' ? (
        items.length === 0 && checkoutStep === 'form' ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">
              Votre panier est vide. Ajoutez vos essentiels Koktek pour continuer.
            </p>
            <Link
              to="/catalogue"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Retour au catalogue
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            {checkoutStep === 'form' ? (
              <form
                id="checkout-form"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Informations de livraison
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Prénom
                    <input
                      type="text"
                      value={delivery.first_name}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          first_name: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Nom
                    <input
                      type="text"
                      value={delivery.last_name}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          last_name: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Email
                    <input
                      type="email"
                      value={delivery.email}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Téléphone
                    <input
                      type="tel"
                      value={delivery.phone}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600 sm:col-span-2">
                    Adresse
                    <input
                      type="text"
                      value={delivery.address_line1}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          address_line1: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600 sm:col-span-2">
                    Complément d'adresse
                    <input
                      type="text"
                      value={delivery.address_line2}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          address_line2: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Code postal
                    <input
                      type="text"
                      value={delivery.postal_code}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          postal_code: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Ville
                    <input
                      type="text"
                      value={delivery.city}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          city: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Région / État
                    <input
                      type="text"
                      value={delivery.region}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          region: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600">
                    Pays
                    <input
                      type="text"
                      value={delivery.country}
                      onChange={(event) =>
                        setDelivery((prev) => ({
                          ...prev,
                          country: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      required
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Adresse de facturation
                  </h2>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={billingDifferent}
                      onChange={(event) =>
                        setBillingDifferent(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    L'adresse de facturation est différente
                  </label>
                </div>

                {!billingDifferent ? (
                  <p className="mt-4 text-sm text-gray-500">
                    Par défaut, l'adresse de facturation est identique à la livraison.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Prénom
                      <input
                        type="text"
                        value={billing.first_name}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            first_name: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Nom
                      <input
                        type="text"
                        value={billing.last_name}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            last_name: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Société (optionnel)
                      <input
                        type="text"
                        value={billing.company_name}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            company_name: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Numéro TVA (optionnel)
                      <input
                        type="text"
                        value={billing.tax_id}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            tax_id: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Email
                      <input
                        type="email"
                        value={billing.email}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Téléphone
                      <input
                        type="tel"
                        value={billing.phone}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600 sm:col-span-2">
                      Adresse
                      <input
                        type="text"
                        value={billing.address_line1}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            address_line1: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600 sm:col-span-2">
                      Complément d'adresse
                      <input
                        type="text"
                        value={billing.address_line2}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            address_line2: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Code postal
                      <input
                        type="text"
                        value={billing.postal_code}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            postal_code: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Ville
                      <input
                        type="text"
                        value={billing.city}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            city: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Région / État
                      <input
                        type="text"
                        value={billing.region}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            region: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      Pays
                      <input
                        type="text"
                        value={billing.country}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            country: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-gray-200 px-4 py-2 text-gray-900"
                        required
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.variant.id}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <img
                      src={resolveImageUrl(item.product.image_url)}
                      alt={item.product.title}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.variant.option1_value}
                          </p>
                        </div>
                        <span className="font-display text-sm font-bold text-gray-900">
                          {formatPrice(item.variant.price * item.quantity)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Quantité : {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            </form>
          ) : checkoutStep === 'payment' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Données enregistrées
                </h2>
                {paymentView === 'choice' ? (
                  <>
                    <p className="mt-2 text-sm text-gray-600">
                      Choisissez maintenant votre mode de paiement pour finaliser la commande.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentView('card')
                        }}
                        onMouseEnter={() => setHoveredBtn('card')}
                        onMouseLeave={() => setHoveredBtn(null)}
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 transform ${
                          hoveredBtn === 'card'
                            ? 'scale-105 shadow-xl bg-indigo-600 text-white border-transparent'
                            : hoveredBtn === 'cash'
                              ? 'opacity-50 bg-gray-100 text-gray-400 border-gray-200 scale-95'
                              : 'bg-indigo-600 text-white border-transparent'
                        }`}
                      >
                        Payer par carte bancaire
                      </button>
                      <button
                        type="button"
                        onClick={handlePayCash}
                        onMouseEnter={() => setHoveredBtn('cash')}
                        onMouseLeave={() => setHoveredBtn(null)}
                        disabled={isPayingCash}
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 transform disabled:cursor-not-allowed disabled:opacity-60 ${
                          hoveredBtn === 'cash'
                            ? 'scale-105 shadow-xl bg-indigo-600 text-white border-transparent'
                            : hoveredBtn === 'card'
                              ? 'opacity-50 bg-gray-100 text-gray-400 border-gray-200 scale-95'
                              : 'bg-white text-gray-900 border-gray-200'
                        }`}
                      >
                        {isPayingCash ? 'Validation...' : 'Payer en espèces'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      Renseignez vos informations de carte pour régler votre commande en toute sécurité.
                    </p>
                    <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-4 text-sm text-indigo-700">
                      Module de paiement sécurisé par carte (Stripe).
                    </div>
                    <button
                      type="button"
                      onClick={handlePaymentOnline}
                      className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Payer par carte bancaire
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentView('choice')}
                      className="w-full text-xs text-gray-400 underline underline-offset-4 transition hover:text-gray-700"
                    >
                      Revenir au choix du paiement
                    </button>
                  </div>
                )}
              </div>

              <section className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.variant.id}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <img
                      src={resolveImageUrl(item.product.image_url)}
                      alt={item.product.title}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.variant.option1_value}
                          </p>
                        </div>
                        <span className="font-display text-sm font-bold text-gray-900">
                          {formatPrice(item.variant.price * item.quantity)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Quantité : {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            </div>
          ) : null}

            <div className="h-fit rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Récapitulatif
              </h2>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Sous-total</span>
                  <span className="font-display font-bold text-gray-900">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Livraison</span>
                  <span>Offerte</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span className="font-display font-bold text-gray-900">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {error ? (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              ) : null}

              {checkoutStep === 'form' ? (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting}
                  className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Enregistrement...'
                    : 'Continuer vers le paiement'}
                </button>
              ) : null}

              <p className="mt-3 text-xs text-gray-500">
                🔒 Étape suivante : Choix du paiement sécurisé.
              </p>
            </div>
          </div>
        )
      ) : null}

      <OrderTicketModal
        open={checkoutStep === 'success'}
        orderNumber={ticketOrderNumber}
        productName={ticketProductName}
        variantName={ticketVariantName}
        variantValue={ticketVariantValue}
        imageUrl={ticketImageUrl}
        customerName={ticketCustomerName}
        total={total}
        hintText="Retrouvez ce bon de commande dans votre espace client."
        showPayByCard
        payByCardLabel="← Retour en arrière — Finalement, je paie par carte"
        onPayByCard={() => {
          setCheckoutStep('payment')
          setPaymentView('card')
        }}
      />
    </div>
  )
}

export default CheckoutPage
