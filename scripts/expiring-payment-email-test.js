const axios = require('axios');
const stripe = require('stripe')(
  'sk_test_51LxZFXJsU2TVwfKBrayeZ9jat97szpp6GOTzdVWQEBHiHns05RlOeYIpCc1IVPrUonfYO0ajeIoSWC75pLj7YHlf00IARDCA6L'
);

const apiBaseUrl = () => {
  const port = process.env.REACT_APP_DEV_API_SERVER_PORT;
  const useDevApiServer = process.env.NODE_ENV === 'development' && !!port;

  // In development, the dev API server is running in a different port
  if (useDevApiServer) {
    return `http://localhost:${port}`;
  }

  // Otherwise, use the same domain and port as the frontend
  return process.env.REACT_APP_CANONICAL_ROOT_URL;
};

const data = {
  id: 'evt_XXXXXXXXXXXXXX',
  object: 'event',
  type: 'customer.source.expiring',
  api_version: '2020-08-27',
  created: 1645688110,
  request: {
    id: null,
    idempotency_key: null,
  },
  livemode: false,
  pending_webhooks: 0,
  data: {
    object: {
      id: 'card_XXXXXXXXXX',
      object: 'card',
      address_city: null,
      address_country: null,
      address_line1: null,
      address_line1_check: null,
      address_line2: null,
      address_state: null,
      address_zip: null,
      address_zip_check: null,
      brand: 'Visa',
      country: 'US',
      customer: 'cus_NFleeY1enkKNJP',
      cvc_check: 'pass',
      dynamic_last4: null,
      exp_month: 2,
      exp_year: 2022,
      fingerprint: 'XXXXXXXXXXXXXXXXXX',
      funding: 'credit',
      last4: '4242',
      metadata: {},
      name: null,
      tokenization_method: null,
    },
  },
};

const card = data.data.object.object === 'card' ? data.data.object : null;

if (card) {
  const stripeCustomerId = card.customer;

  stripe.customers
    .retrieve(stripeCustomerId)
    .then(customer => {
      const userId = customer.metadata['sharetribe-user-id'];

      // TODO: Replace template data when available
      axios.post(
        `http://10.0.0.222:3500/api/sendgrid-template-email`,
        {
          receiverId: userId,
          templateName: 'payment-expiring',
          templateData: {},
        },
        {
          headers: {
            'Content-Type': 'application/transit+json',
          },
        }
      );
    })
    .catch(e => console.log(e, 'send-payment-expiring-email-failed', {}));
}
