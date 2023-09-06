const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const { Configuration, OpenAIApi } = require('openai');
const { default: next } = require('next');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const isDev = process.env.REACT_APP_ENV === 'development';

module.exports = (req, res) => {
  const { prompt, maxTokens = 250, temperature = 1, n = 1 } = req.body;

  if (isDev) {
    res
      .set('Content-Type', 'application/transit+json')
      .send(
        serialize({
          data: '',
        })
      )
      .end();
    return;
  }

  const openai = new OpenAIApi(configuration);

  openai
    .createCompletion(
      {
        model: 'text-davinci-003',
        prompt,
        temperature,
        max_tokens: maxTokens,
      },
      {
        timeout: 60000,
      }
    )
    .then(response => {
      res
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            data: response.data.choices[0].text.trim(),
          })
        )
        .end();
    })
    .catch(error => {
      log.error(error?.response?.error?.data, 'openai-generate-text-failed', { prompt });
      res
        .status(500)
        .json({ error })
        .end();
    });
};
