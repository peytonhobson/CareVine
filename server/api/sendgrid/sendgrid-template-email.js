const sgMail = require('@sendgrid/mail');
const { integrationSdk, handleError, serialize } = require('../../api-util/sdk');
const log = require('../../log');

const SENDGRID_TEMPLATE_IDS = {
  'new-message': 'd-99a691ae1af04a42abe2669208474925',
  'listing-approved': 'd-8d1336cd49d3418e99a94f4df6a4cfa3',
  'listing-closed': 'd-ffec855f57624725ba0c3ecb884f88a1',
  'background-check-approved': 'd-fc9ca12f344d4f26b744b6397d51fc41',
  'background-check-rejected': 'd-1af0298cc6424aaf86d2647848b1571d',
  'subscription-confirmed': 'd-65eb5714fbf24441973a7dd4e9517b5d',
  'subscription-canceled': 'd-282d6dff340b4f8ba3c7cc3f40583725',
  'payment-expiring': 'd-77d689cbc3054d52ade077336ed14ac5',
  'payment-failed': 'd-f3f7c126303b4118a2b776be029d15e2',
  'subscription-schedule-confirmed': 'd-05fec989fca84d4f870e1786a9377ce1',
  'subscription-schedule-canceled': 'd-408b5788c9c8429ea66f077a2910669c',
  'subscription-reactivated': 'd-000a9e879d4c47668276e57eb0a44ec6',
  'subscription-upgraded': 'd-2779c5dca2a5486196bd6cb10fb8d279',
  'payment-received': 'd-9c4c3363ed4d4771aafdd4e221e7c1eb',
};

module.exports = (req, res) => {
  const { receiverId, templateData, templateName } = req.body;

  integrationSdk.users
    .show({ id: receiverId })
    .then(userResponse => {
      const user = userResponse?.data?.data;
      const receiverEmail = user?.attributes?.email;

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const msg = {
        from: 'CareVine@carevine.us',
        personalizations: [
          {
            to: [
              {
                email: receiverEmail,
              },
            ],
            dynamic_template_data: templateData,
          },
        ],
        template_id: SENDGRID_TEMPLATE_IDS[templateName],
      };

      return sgMail.send(msg);
    })
    .then(apiResponse => {
      res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: apiResponse,
          })
        )
        .end();
    })
    .catch(e => {
      log.error(e, 'sendgrid-email', e);
    });
};
