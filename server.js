const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/openai', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful and knowledgeable doctor. Give short, friendly, medical advice in response to patient questions.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    const reply = response.data.choices[0].message.content.trim();
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI API error:', error.response ? error.response.data : error.message || error);
    res.status(500).json({ error: 'OpenAI API error' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`OpenAI proxy server running on http://localhost:${PORT}`);
});
