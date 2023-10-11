const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = async (req, res) => {
  const { txId, metadata } = req.body;

  try {
    const apiResponse = await integrationSdk.transactions.updateMetadata(
      {
        id: txId,
        metadata,
      },
      {
        expand: true,
      }
    );

    const { status, statusText, data } = apiResponse;
    res
      .status(status)
      .set('Content-Type', 'application/transit+json')
      .send(
        serialize({
          status,
          statusText,
          data,
        })
      )
      .end();
  } catch (e) {
    log.error(e?.data?.errors?.[0]?.source);
    handleError(res, e);
  }
};
