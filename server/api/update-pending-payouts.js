const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

module.exports = (req, res) => {
  const { userId, params, txId } = req.body;

  integrationSdk.users
    .show({
      id: userId,
    })
    .then(fetchedUser => {
      const oldPendingPayouts =
        fetchedUser.data.data.attributes.profile.privateData.pendingPayouts || [];

      const newPendingPayouts = oldPendingPayouts.map(payout => {
        if (payout.txId === txId) {
          return {
            ...payout,
            ...params,
          };
        }
        return payout;
      });

      return integrationSdk.users.updateProfile(
        {
          id: userId,
          privateData: {
            pendingPayouts: newPendingPayouts,
          },
        },
        {
          expand: true,
          'fields.user': ['profile.privateData'],
        }
      );
    })
    .then(apiResponse => {
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
    })
    .catch(e => {
      log.error(e, 'update-pending-payout-failed', {});
    });
};
