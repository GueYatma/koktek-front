import { useEffect, useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { formatPrice } from '../utils/format';

interface StripeCheckoutFormProps {
  amount: number;
  orderNumber: string;
  customerEmail: string;
  onSuccess: () => void;
  onCancel: () => void;
  // This URL is passed to N8N webhook
  webhookUrl: string;
}

export default function StripeCheckoutForm({
  amount,
  orderNumber,
  customerEmail,
  onSuccess,
  onCancel,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Paiement réussi!');
          onSuccess();
          break;
        case 'processing':
          setMessage('Votre paiement est en cours de traitement.');
          break;
        case 'requires_payment_method':
          setMessage('Votre paiement a été refusé. Veuillez réessayer.');
          break;
        default:
          setMessage('Un problème est survenu.');
          break;
      }
    });
  }, [stripe, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL where the customer should be redirected after the PaymentIntent is confirmed.
        return_url: `${window.location.origin}/checkout?step=success&order=${orderNumber}`,
        receipt_email: customerEmail,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message ?? 'Une erreur est survenue avec votre carte.');
      } else {
        setMessage('Une erreur inattendue est survenue.');
      }
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Paiement réussi!');
      onSuccess();
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full">
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">
          Montant à régler : <span className="font-bold text-blue-700">{formatPrice(amount)}</span>
        </p>
        <p className="mt-1 text-xs text-blue-700">Commande {orderNumber}</p>
      </div>

      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          disabled={isLoading || !stripe || !elements}
          onClick={onCancel}
          className="w-1/3 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          disabled={isLoading || !stripe || !elements}
          id="submit"
          className="flex flex-1 items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Traitement...
              </div>
            ) : (
              `Payer ${formatPrice(amount)}`
            )}
          </span>
        </button>
      </div>
      
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {message}
        </div>
      )}
    </form>
  );
}
