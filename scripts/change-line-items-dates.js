require('dotenv').config();
const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
const moment = require('moment');
const ISO_OFFSET_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID_DEV,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET_DEV,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

const queryAllPages = async (page = 1, allResults = []) => {
  try {
    const response = await integrationSdk.transactions.query({
      perPage: 100,
      page,
    });

    console.log('reponse', response);

    const { data, meta } = response;
    const { totalPages, page: currentPage } = data.meta;
    const results = [...allResults, ...data.data];
    if (currentPage < totalPages) {
      return queryAllPages(currentPage + 1, results);
    } else {
      return results;
    }
  } catch (err) {
    // console.log(err);
  }
};

const main = async () => {
  try {
    console.log(1);
    const transactions = await queryAllPages();

    const all = transactions.filter(t => t.attributes.processName === 'booking-process');

    await Promise.all(
      all.map(async tx => {
        const { lineItems } = tx.attributes.metadata;

        const newLineItems = lineItems.map(l => ({
          ...l,
          date: moment(l.date)
            .utcOffset(-360)
            .format(ISO_OFFSET_FORMAT),
        }));

        try {
          await integrationSdk.transactions.updateMetadata({
            id: tx.id.uuid,
            metadata: {
              lineItems: newLineItems,
            },
          });
        } catch (err) {
          console.log(err);
        }
      })
    );
  } catch (err) {
    console.log(err.data);
  }
};

main();
