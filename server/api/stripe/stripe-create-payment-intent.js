const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { integrationSdk, handleError, handleStripeError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

module.exports = (req, res) => {
  // Create a PaymentIntent with the order amount and currency

  const {
    recipientId,
    amount,
    sender,
    metadata,
    stripeCustomerId,
    description,
    bookingFee,
    processingFee,
    params,
    paymentMethods,
  } = req.body;

  const paramsMaybe = params ? params : {};

  integrationSdk.users
    .show({ id: recipientId.uuid, include: ['stripeAccount'] })
    .then(res => {
      const stripeAccountId = apiResponse.data.data?.relationships?.stripeAccount?.data?.id?.uuid;

      const senderEmail = sender?.attributes?.email;
      const senderId = sender?.id?.uuid;

      return stripe.paymentIntents.create({
        amount: parseInt(amount + processingFee),
        currency: 'usd',
        payment_method_types: paymentMethods ? paymentMethods : ['card'],
        transfer_data: {
          destination: stripeAccountId,
        },
        application_fee_amount: parseInt(bookingFee + processingFee),
        customer: stripeCustomerId,
        receipt_email: senderEmail,
        description,
        metadata: { userId: senderId, ...metadata },
        ...paramsMaybe,
      });
    })
    .then(apiResponse => {
      res
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            ...apiResponse,
          })
        )
        .end();
    })
    .catch(e => {
      if (e.raw) {
        handleStripeError(res, e);
      } else {
        handleError(res, e);
      }
    });
};
