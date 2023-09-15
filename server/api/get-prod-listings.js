const flexIntegrationSdk = require('sharetribe-flex-integration-sdk');
const { serialize } = require('../api-util/sdk');

const integrationSdk = flexIntegrationSdk.createInstance({
  // These two env vars need to be set in the `.env` file.
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID_PROD,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET_PROD,

  // Normally you can just skip setting the base URL and just use the
  // default that the `createInstance` uses. We explicitly set it here
  // for local testing and development.
  baseUrl: process.env.FLEX_INTEGRATION_BASE_URL || 'https://flex-integ-api.sharetribe.com',
});

module.exports = (req, res) => {
  const { listingType } = req.body;

  // Create a function that will query as many pages as there are total pages
  // in the response. This is a bit of a hack, but it's the easiest way to
  // get all the listings in one go.
  const queryAllPages = (query, page = 1, allResults = []) => {
    return integrationSdk.listings
      .query({
        meta_listingType: listingType,
        states: ['published'],
        perPage: 100,
        page,
        include: ['author'],
      })
      .then(response => {
        const { data, meta } = response;
        const { totalPages, page: currentPage } = data.meta;
        const results = [...allResults, ...data.data];
        if (currentPage < totalPages) {
          return queryAllPages(query, currentPage + 1, results);
        } else {
          return results;
        }
      });
  };

  queryAllPages()
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
      console.log(e, 'Error querying prod listings', {});
    });
};
