const stripe = require('stripe')();

stripe.subscriptions
  .list({
    customer: 'cus_NFleeY1enkKNJP',
  })
  .then(response => {
    const subscriptions = response.data;

    if (subscriptions.length > 0) {
      subscriptions.forEach(sub => {
        stripe.subscriptions.del(sub.id).catch(() => {
          console.log(`Failed to delete incomplete subscription ${sub.id}`);
        });
      });
    }

    return response;
  });
