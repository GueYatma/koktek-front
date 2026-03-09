import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import StripeCheckoutForm from '../components/StripeCheckoutForm'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/format'
import { resolveImageUrl } from '../utils/image'
import { saveOrderForEmail } from '../utils/customerOrders'
import { resolveVariantValue } from '../utils/variant'
import OrderTicketModal from '../components/OrderTicketModal'
import BackButton from '../components/BackButton'
import {
  addCartItem,
  createCart,
  createCustomer,
  createOrder,
  createOrderBilling,
  createOrderDelivery,
  createOrderItems,
  getCartItems,
  getCustomerByEmail,
  markOrderPaid,
  removeCartItem,
  updateCartItem,
} from '../lib/commerceApi'

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as
  | string
  | undefined

const N8N_STRIPE_INTENT_URL = import.meta.env.VITE_N8N_STRIPE_INTENT_URL as string | undefined

const stripePromise = loadStripe((import.meta.env.VITE_STRIPE_PUBLIC_KEY as string) || '')

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
  const navigate = useNavigate()
  const { items, total, subtotal, shippingTotal, itemCount, clearCart, cartId, setCartId } = useCart()
  const { user, login, updateProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPayingCash, setIsPayingCash] = useState(false)
  const [isPayingOnline, setIsPayingOnline] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [billingDifferent, setBillingDifferent] = useState(false)
  const [cashPulse, setCashPulse] = useState(false)
  const [cashHovered, setCashHovered] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [paymentView, setPaymentView] = useState<PaymentView>('choice')
  const [isCashConfirmOpen, setIsCashConfirmOpen] = useState(false)
  const [confirmedMethod, setConfirmedMethod] = useState<'cash' | 'card' | null>(null)
  const checkoutStepRef = useRef<CheckoutStep>(checkoutStep)
  const [customerSnapshot, setCustomerSnapshot] = useState<{
    email: string
    first_name: string
    last_name: string
    phone?: string
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

  // Remonter en haut de la page lors d'un changement d'étape interne au Checkout
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [checkoutStep, paymentView])

  // Failsafe for Stripe 3D Secure redirects
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const step = searchParams.get('step')
    const order = searchParams.get('order')
    
    if (step === 'success' && order) {
      setOrderNumber(order)
      setConfirmedMethod('card')
      setCheckoutStep('success')
    }
  }, [])

  useEffect(() => {
    return () => {
      if (checkoutStepRef.current === 'success') {
        clearCart()
      }
    }
  }, [clearCart])

  const cashHoveredRef = useRef(cashHovered)
  useEffect(() => {
    cashHoveredRef.current = cashHovered
    if (cashHovered) {
      setCashPulse(false)
    }
  }, [cashHovered])

  // Cartoon animation for the cash button
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined
    let resetTimeout: ReturnType<typeof setTimeout> | undefined

    const triggerAnimation = () => {
      if (cashHoveredRef.current) return
      setCashPulse(true)
      resetTimeout = setTimeout(() => setCashPulse(false), 1200)
    }

    const shouldAnimateCash = paymentView === 'choice' && confirmedMethod !== 'card'

    if (shouldAnimateCash) {
      // Trigger after a slight delay (0.6s) to allow page insertion and scroll-to-top
      resetTimeout = setTimeout(triggerAnimation, 600)
      
      // Repeat every 10s
      intervalId = setInterval(triggerAnimation, 10000)
    } else {
      setCashPulse(false)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
      if (resetTimeout) clearTimeout(resetTimeout)
    }
  }, [paymentView, confirmedMethod])

  const paymentButtonBase =
    'w-full rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg outline-none transition-all duration-200 hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'

  const resolveCountryCode = (value: string) => {
    const normalized = value.trim()
    if (!normalized) return normalized
    if (normalized.toLowerCase().includes('france')) return 'FR'
    if (normalized.length === 2) return normalized.toUpperCase()
    return normalized
  }

  const handlePaymentOnline = async () => {
    if (!orderId || isPayingOnline || !N8N_STRIPE_INTENT_URL) {
      if (!N8N_STRIPE_INTENT_URL) {
        setError('Le serveur de paiement n\'est pas configuré. Veuillez contacter le support.');
      }
      return;
    }
    
    setPaymentView('card')
    setIsPayingOnline(true)
    setError(null)

    try {
      const response = await fetch(N8N_STRIPE_INTENT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(total * 100), // Stripe exige des centimes
          currency: 'eur',
          order_id: orderId,
          order_number: orderNumber ?? orderId,
          receipt_email: customerSnapshot?.email || delivery.email.trim(),
          metadata: {
            order_id: orderId,
            order_number: orderNumber ?? orderId,
            customer_email: customerSnapshot?.email || delivery.email.trim(),
          },
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.client_secret) {
        throw new Error(data.message || 'Impossible de générer la session de paiement')
      }

      setClientSecret(data.client_secret)
    } catch (e: any) {
      console.error('Erreur Stripe webhook', e)
      setError(e.message || 'Une erreur est survenue lors de la connexion au serveur de paiement.')
      setPaymentView('choice')
    } finally {
      setIsPayingOnline(false)
    }
  }

  const handlePayCash = async () => {
    if (!orderId || isPayingCash) return
    setIsPayingCash(true)
    setError(null)

    try {
      // Étape 1: passer la commande en attente de paiement espèces.
      await markOrderPaid(orderId, {
        status: 'pending', // Le statut de l'expédition/commande reste 'pending' (en attente d'expédition)
        payment_status: 'pending_cash', // Le paiement lui-même est en attente d'encaissement d'espèces
        payment_method: 'Espèces',
      })

      // Étape 2: afficher le message de succès immédiatement.
      setConfirmedMethod('cash')
      setCheckoutStep('success')

      // Étape 3: notifier le workflow externe via webhook en arrière-plan.
      if (N8N_WEBHOOK_URL) {
        void fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Webhook n8n: envoi des informations complètes de commande
          body: JSON.stringify({
            order_id: orderId,
            order_number: orderNumber ?? orderId,
            total_amount: total,
            shipping_amount: shippingTotal,
            payment_method: 'cash',
            backoffice_url: `${window.location.origin}/admin?validate_order=${orderNumber ?? orderId}`,
            customer: {
              name: ticketCustomerName,
              email: customerSnapshot?.email || delivery.email.trim(),
              phone: customerSnapshot?.phone || delivery.phone.trim(),
            },
            items: items.map((item) => ({
              product_title: item.product.title,
              variant_name: item.variant.option1_name,
              variant_value: resolveVariantValue(item.variant),
              quantity: item.quantity,
              unit_price: item.product.prix_calcule ?? item.product.retail_price,
              image: resolveImageUrl(item.product.image_url)
            }))
          }),
        }).catch((webhookError) => {
          console.error('Erreur webhook n8n', webhookError)
        })
      }

      const email = customerSnapshot?.email || delivery.email.trim()
      if (email) {
        const mainItem = items[0]
        saveOrderForEmail(email, {
          id: orderId,
          orderNumber: orderNumber ?? orderId,
          total,
          productName: mainItem ? mainItem.product.title : 'Commande Koktek',
          variantName: mainItem?.variant.option1_name ?? null,
          variantValue: resolveVariantValue(mainItem?.variant ?? null) || null,
          imageUrl: mainItem ? resolveImageUrl(mainItem.product.image_url) : null,
          sku: mainItem?.variant.sku ?? null,
          status: 'pending_cash',
          payment_status: 'pending_cash',
          customerName: ticketCustomerName || null,
          createdAt: new Date().toISOString(),
        })
      }
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

      // Étape 2: création du cart Directus uniquement au checkout.
      let resolvedCartId = cartId
      try {
        if (!resolvedCartId) {
          const cart = await createCart({
            status: 'open',
            currency: 'EUR',
            customer_id: customerId,
          })
          resolvedCartId = cart.id
          setCartId(cart.id)
        }

        if (!resolvedCartId) {
          throw new Error('Cart ID manquant')
        }

        const remoteItems = await getCartItems(resolvedCartId)
        const remoteByKey = new Map(
          remoteItems.map((item) => [
            `${item.product_id}::${item.variant_id ?? 'none'}`,
            item,
          ]),
        )
        const desiredKeys = new Set<string>()

        for (const item of items) {
          const key = `${item.product.id}::${item.variant?.id ?? 'none'}`
          desiredKeys.add(key)
          const existing = remoteByKey.get(key)

          if (existing) {
            const nextQuantity = item.quantity
            const nextUnitPrice = item.product.prix_calcule ?? item.product.retail_price
            const currentUnitPrice = existing.unit_price ?? null

            if (
              existing.quantity !== nextQuantity ||
              currentUnitPrice !== nextUnitPrice
            ) {
              await updateCartItem(existing.id, {
                quantity: nextQuantity,
                unit_price: nextUnitPrice,
              })
            }
          } else {
            await addCartItem({
              cart_id: resolvedCartId,
              product_id: item.product.id,
              variant_id: item.variant?.id ?? null,
              quantity: item.quantity,
              unit_price: item.product.prix_calcule ?? item.product.retail_price,
              currency: 'EUR',
            })
          }
        }

        const staleItems = remoteItems.filter(
          (item) =>
            !desiredKeys.has(`${item.product_id}::${item.variant_id ?? 'none'}`),
        )
        if (staleItems.length > 0) {
          await Promise.all(
            staleItems.map((item) => removeCartItem(item.id)),
          )
        }
      } catch (cartError) {
        console.error('Erreur synchronisation panier', cartError)
        throw cartError
      }

      // Étape 3: préparation des données de relation (création séquentielle).
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        variant_id: item.variant?.id ?? null,
        quantity: item.quantity,
        unit_price: item.product.prix_calcule ?? item.product.retail_price,
        line_total: (item.product.prix_calcule ?? item.product.retail_price) * item.quantity,
        currency: 'EUR',
      }))
      const orderDelivery = {
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
      }
      const orderBilling = billingDifferent
        ? {
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
          }
        : undefined

      const shippingAddress = {
        address_line1: delivery.address_line1.trim(),
        address_line2: delivery.address_line2.trim() || null,
        postal_code: delivery.postal_code.trim(),
        city: delivery.city.trim(),
        country: delivery.country.trim(),
      }

      const logisticName = items.find(i => i.shippingOption?.name)?.shippingOption?.name ?? 'Standard'

      const order = await createOrder({
        cart_id: resolvedCartId,
        customer_id: customerId,
        status: 'pending_payment',
        currency: 'EUR',
        subtotal: total - shippingTotal,
        total,
        total_price: total,
        total_products_price: total - shippingTotal,
        shipping_price: shippingTotal,
        shipping_address: shippingAddress,
        logistic_name: logisticName,
        item_count: itemCount,
      })

      // Guard: vérifier que Directus a bien renvoyé un UUID valide
      if (!order?.id) {
        console.error('createOrder a retourné un objet sans id:', order)
        throw new Error('La création de commande a échoué : aucun identifiant retourné par le serveur.')
      }

      // Étape 5: création des lignes de commande.
      await createOrderItems(
        orderItems.map((item) => ({
          ...item,
          order_id: order.id,
        })),
      )

      // Étape 6: création de la livraison.
      await createOrderDelivery({
        order_id: order.id,
        ...orderDelivery,
      })

      // Étape 7: création de la facturation uniquement si différente.
      if (orderBilling) {
        await createOrderBilling({
          order_id: order.id,
          ...orderBilling,
        })
      }

      // Étape 8: passage à l'étape de paiement.
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
          variantValue: resolveVariantValue(mainItem?.variant ?? null) || null,
          imageUrl: mainItem ? resolveImageUrl(mainItem.product.image_url) : null,
          sku: mainItem?.variant.sku ?? null,
          status: order.status ?? 'pending_payment',
          payment_status: order.payment_status ?? 'pending_payment',
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
      <div className="mb-10 flex items-start gap-4">
        <BackButton fallback="/catalogue" className="mt-1 shrink-0" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            Paiement
          </p>
          <h1 className="text-3xl font-semibold text-gray-900">
            Finaliser la commande
          </h1>
        </div>
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                        className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
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
                          className="rounded-xl border border-gray-200 px-4 py-2 text-[16px] text-gray-900"
                        required
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                {items.map((item) => {
                  const variantValue = resolveVariantValue(item.variant)
                  const unitPrice = item.product.prix_calcule ?? item.product.retail_price
                  const articleTotal = unitPrice * item.quantity
                  const shippingName = item.shippingOption?.name
                  const shippingPrice = item.shippingOption?.price != null ? Number(item.shippingOption.price) : 0
                  const weightGrams = item.variant.weight_grams
                  // Mieux : on affiche explicitement le prix pour l'article et la portion de livraison
                  return (
                  <div
                    key={item.variant.id}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <img
                      src={resolveImageUrl(item.product.image_url)}
                      alt={item.product.title}
                      className="h-20 w-20 rounded-xl object-cover bg-gray-50"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {variantValue || '—'}
                          </p>
                          {weightGrams != null && weightGrams > 0 && (
                            <p className="text-xs text-gray-400">Poids : {weightGrams}g</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Qté : {item.quantity}
                          </p>
                        </div>
                      </div>
                      
                      {/* --- NOUVEAU BLOC PRIX DÉTAILLÉ --- */}
                      <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                        <div className="flex justify-between items-center text-[11px] text-gray-500">
                          <span>Prix article {item.quantity > 1 ? `(${formatPrice(unitPrice)} × ${item.quantity})` : ''}</span>
                          <span className="font-semibold text-gray-700">{formatPrice(articleTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            Livraison {shippingName ? `(${shippingName})` : ''}
                          </span>
                          <span className="font-semibold text-gray-700">
                            {shippingPrice > 0 ? `+ ${formatPrice(shippingPrice)}` : 'Inclus'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-gray-100/50 text-xs">
                          <span className="font-semibold text-gray-900 uppercase tracking-wider text-[10px]">Total Ligne</span>
                          <span className="font-bold text-gray-900">
                            {formatPrice(articleTotal + shippingPrice)}
                          </span>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                )})}
              </section>
            </form>
          ) : checkoutStep === 'payment' ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Données enregistrées
                </h2>
                {!clientSecret ? (
                  <>
                    <p className="mt-2 text-sm text-gray-600">
                      Choisissez maintenant votre mode de paiement pour finaliser la commande.
                    </p>
                    <div className="mt-6 flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={handlePaymentOnline}
                        disabled={isPayingOnline || !N8N_STRIPE_INTENT_URL}
                        className={paymentButtonBase}
                      >
                        {isPayingOnline ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Préparation...
                          </div>
                        ) : (
                          'Payer par carte bancaire'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                          setIsCashConfirmOpen(true)
                        }}
                        onMouseEnter={() => setCashHovered(true)}
                        onMouseLeave={() => setCashHovered(false)}
                        disabled={isPayingCash || isPayingOnline}
                        className={`${paymentButtonBase} ${cashPulse && !cashHovered ? 'animate-cartoon-bounce z-10' : ''}`}
                      >
                        {isPayingCash ? 'Validation...' : 'Payer en espèces'}
                      </button>
                    </div>
                    {!N8N_STRIPE_INTENT_URL && (
                      <p className="mt-3 text-xs text-red-500 text-center">
                        La clé du serveur de paiement n'est pas configurée dans .env
                      </p>
                    )}
                  </>
                ) : (
                  <div className="mt-4">
                    <Elements options={{ clientSecret, appearance: { theme: 'stripe' } }} stripe={stripePromise}>
                      <StripeCheckoutForm
                        amount={total}
                        orderNumber={orderNumber ?? orderId!}
                        customerEmail={customerSnapshot?.email || ''}
                        webhookUrl=""
                        onSuccess={async () => {
                          setConfirmedMethod('card')

                          // Mirror the cash flow: mark order as paid in Directus
                          if (orderId) {
                            try {
                              await markOrderPaid(orderId, {
                                status: 'paid',
                                payment_status: 'paid',
                                payment_method: 'Carte Bancaire',
                              })
                            } catch (e) {
                              console.error('Erreur mise à jour commande Stripe', e)
                            }

                            // Save order to local email history
                            const email = customerSnapshot?.email || delivery.email.trim()
                            if (email) {
                              const mainItem = items[0]
                              saveOrderForEmail(email, {
                                id: orderId,
                                orderNumber: orderNumber ?? orderId,
                                total,
                                productName: mainItem ? mainItem.product.title : 'Commande Koktek',
                                variantName: mainItem?.variant.option1_name ?? null,
                                variantValue: resolveVariantValue(mainItem?.variant ?? null) || null,
                                imageUrl: mainItem ? resolveImageUrl(mainItem.product.image_url) : null,
                                sku: mainItem?.variant.sku ?? null,
                                status: 'paid',
                                payment_status: 'paid',
                                customerName: ticketCustomerName || null,
                                createdAt: new Date().toISOString(),
                              })
                            }
                          }

                          setCheckoutStep('success')
                        }}
                        onCancel={() => {
                          setPaymentView('choice')
                          setClientSecret(null)
                        }}
                      />
                    </Elements>
                  </div>
                )}
              </div>

              <section className="space-y-4">
                {items.map((item) => {
                  const variantValue = resolveVariantValue(item.variant)
                  const unitPrice = item.product.prix_calcule ?? item.product.retail_price
                  const articleTotal = unitPrice * item.quantity
                  const shippingName = item.shippingOption?.name
                  const shippingPrice = item.shippingOption?.price != null ? Number(item.shippingOption.price) : 0
                  const weightGrams = item.variant.weight_grams
                  
                  return (
                  <div
                    key={item.variant.id}
                    className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <img
                      src={resolveImageUrl(item.product.image_url)}
                      alt={item.product.title}
                      className="h-20 w-20 rounded-xl object-cover bg-gray-50"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {item.product.title}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {variantValue || '—'}
                          </p>
                          {weightGrams != null && weightGrams > 0 && (
                            <p className="text-xs text-gray-400">Poids : {weightGrams}g</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Qté : {item.quantity}
                          </p>
                        </div>
                      </div>
                      
                      {/* --- NOUVEAU BLOC PRIX DÉTAILLÉ --- */}
                      <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
                        <div className="flex justify-between items-center text-[11px] text-gray-500">
                          <span>Prix article {item.quantity > 1 ? `(${formatPrice(unitPrice)} × ${item.quantity})` : ''}</span>
                          <span className="font-semibold text-gray-700">{formatPrice(articleTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            Livraison {shippingName ? `(${shippingName})` : ''}
                          </span>
                          <span className="font-semibold text-gray-700">
                            {shippingPrice > 0 ? `+ ${formatPrice(shippingPrice)}` : 'Inclus'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 mt-1 border-t border-gray-100/50 text-xs">
                          <span className="font-semibold text-gray-900 uppercase tracking-wider text-[10px]">Total Ligne</span>
                          <span className="font-bold text-gray-900">
                            {formatPrice(articleTotal + shippingPrice)}
                          </span>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                )})}
              </section>
            </div>
          ) : null}

            <div className="flex flex-col h-fit gap-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Récapitulatif
                </h2>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Sous-total articles</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Frais de livraison</span>
                    <span className="font-semibold text-gray-900">
                      {shippingTotal > 0 ? formatPrice(shippingTotal) : items.length === 0 ? '—' : 'Inclus'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>TVA</span>
                    <span className="font-semibold text-gray-900">0 %</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-gray-900 border-t border-gray-200 pt-3 mt-3">
                    <span>Total estimé</span>
                    <span className="text-lg">
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

              <div className="flex flex-col gap-3">
                <Link
                  to="/?cart=open"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-3.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/80 hover:text-amber-900 hover:shadow-[0_8px_16px_-6px_rgba(245,158,11,0.15)]"
                >
                  <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">←</span>
                  <span>Retour au panier</span>
                </Link>
                <Link
                  to="/catalogue"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-gray-50/60 px-4 py-3.5 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/80 hover:text-amber-900 hover:shadow-[0_8px_16px_-6px_rgba(245,158,11,0.15)]"
                >
                  <span className="transition-transform duration-300 ease-out group-hover:-translate-x-1">←</span>
                  <span>Retour au catalogue</span>
                </Link>
              </div>
            </div>
          </div>
        )
      ) : null}

      <OrderTicketModal
        open={checkoutStep === 'success'}
        orderNumber={ticketOrderNumber}
        items={items.map((cartItem) => ({
          imageUrl: resolveImageUrl(cartItem.product.image_url),
          productName: cartItem.product.title,
          variantName: cartItem.variant.option1_name?.trim() || null,
          variantValue: resolveVariantValue(cartItem.variant) || null,
          sku: cartItem.variant.sku?.trim() || null,
          quantity: cartItem.quantity,
        }))}
        customerName={ticketCustomerName}
        total={total}
        subtotal={subtotal}
        shippingTotal={shippingTotal}
        noticeTone={confirmedMethod === 'card' ? 'success' : 'danger'}
        onContinueShopping={() => navigate('/catalogue')}
        showPayByCard={confirmedMethod === 'cash'}
        onPayByCard={async () => {
          setCheckoutStep('payment')
          setConfirmedMethod(null)
          await handlePaymentOnline()
        }}
        onClose={
          confirmedMethod === 'cash'
            ? undefined
            : () => {
                navigate('/')
              }
        }
        headerLabel={confirmedMethod === 'card' ? "REÇU DE PAIEMENT" : "BON DE COMMANDE"}
        title={confirmedMethod === 'card' ? "Paiement Validé !" : "Commande Réservée !"}
        noticeText={confirmedMethod === 'card' ? "Votre paiement en ligne a été effectué avec succès. Votre commande est en cours de préparation." : undefined}
        hintText="Retrouvez le détail de l'opération dans votre espace client."
        payByCardLabel="← Retour en arrière — Finalement, je paie par carte"
      />

      {isCashConfirmOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCashConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Confirmer le paiement en espèces ?
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Votre commande ne sera préparée et envoyée que lorsque vous remettrez les espèces à notre vendeur dans notre boutique ou l&apos;un de nos stands à Marseille et alentours. Si vous confirmez, un bon de commande sera généré pour le retrait.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCashConfirmOpen(false)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 sm:w-auto"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCashConfirmOpen(false)
                  void handlePayCash()
                }}
                className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-black sm:w-auto"
              >
                Oui, je confirme
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default CheckoutPage
