const express = require('express');
const { TwitterApi } = require('twitter-api-v2');
const dotenv = require('dotenv');

dotenv.config(); // Load .env variables

const app = express();
const PORT = 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// Twitter client using credentials from .env
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

// POST /tweet with { "content": "Your tweet text here" }
app.post('/tweet', async (req, res) => {
  const { content } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "content" field in body' });
  }

  try {
    const response = await twitterClient.v2.tweet(content);
    res.status(200).json({ success: true, tweet: response });
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).json({ success: false, error: 'Failed to post tweet' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});