const { integrationSdk, handleError, serialize } = require('../api-util/sdk');
const log = require('../log');

const OPEN_AI_URL = 'https://api.openai.com/v1/engines/davinci-codex/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

module.exports = async (req, res) => {
  // Create a PaymentIntent with the order amount and currency

  const { prompt, maxTokens = 150, temperature = 0.7, n = 1 } = req.body;

  const body = {
    prompt,
    max_tokens: maxTokens,
    n,
    temperature,
  };

  try {
    const response = await axios.post(OPEN_AI_URL, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].text.trim();
    } else {
      throw new Error(`API request failed with status ${response.status}`);
    }
  } catch (error) {
    log.error(error, 'chatgpt-generate-text-failed');
  }
};
