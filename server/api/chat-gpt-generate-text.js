const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  const { prompt, maxTokens = 200, temperature = 1, n = 1 } = req.body;

  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature,
      max_tokens: maxTokens,
    });

    res
      .set('Content-Type', 'application/transit+json')
      .send(
        serialize({
          data: response.data.choices[0].text.trim(),
        })
      )
      .end();
  } catch (error) {
    log.error(error?.response?.data, 'chatgpt-generate-text-failed');
  }
};
