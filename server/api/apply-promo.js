const axios = require('axios');
const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
var awsConfig = require('aws-config');
var AWS = require('aws-sdk');
const isDev = process.env.REACT_APP_ENV === 'development';

async function streamToString(stream) {
  // lets have a ReadableStream as a stream variable
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

module.exports = (req, res) => {
  const { promoCode } = req.body;

  var file = `promo-codes/promo-codes${isDev && '-test'}.json`;
  //   console.log('Trying to download file', fileKey);

  const s3 = new AWS.S3({
    accessKeyId: process.env.IAM_USER_KEY,
    secretAccessKey: process.env.IAM_USER_SECRET,
    Bucket: process.env.PROMO_BUCKET_NAME,
  });

  var options = {
    Bucket: process.env.PROMO_BUCKET_NAME,
    Key: file,
  };

  s3.getObject(options, function(err, data) {
    if (err) {
      handleError(err, err.response);
    } else {
      const promoCodes = JSON.parse(data.Body.toString('utf-8'));

      const promo = promoCodes[promoCode];

      if (promo) {
        delete promoCodes[promoCode];

        const buf = Buffer.from(JSON.stringify(promoCodes));

        const putOptions = {
          Body: buf,
          Bucket: process.env.PROMO_BUCKET_NAME,
          Key: file,
        };

        return s3.putObject(putOptions, function(err, data) {
          if (err) {
            console.log('here');
            handleError(err, err.response);
          } else {
            return res
              .status(200)
              .set('Content-Type', 'application/transit+json')
              .send(
                serialize({
                  data: {
                    discount: promo,
                  },
                })
              )
              .end();
          }
        });
      }

      return res
        .status(200)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: {
              discount: promo,
            },
          })
        )
        .end();
    }
  });
};
