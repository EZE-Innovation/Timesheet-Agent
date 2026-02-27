/**
 * Echo Bot - Express server and Bot Framework adapter
 * Production-ready entry point for Microsoft Teams Echo Bot.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const {
  CloudAdapter,
  ConfigurationBotFrameworkAuthentication,
  BotFrameworkAdapter,
} = require('botbuilder');
const { EchoBot } = require('./bot');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3978;
const hasCredentials =
  process.env.MicrosoftAppId && process.env.MicrosoftAppPassword;

// Use CloudAdapter for production/Teams (when credentials are set).
// Use BotFrameworkAdapter for local Emulator (works with empty credentials).
const adapter = hasCredentials
  ? new CloudAdapter(
      new ConfigurationBotFrameworkAuthentication(process.env)
    )
  : new BotFrameworkAdapter({
      appId: process.env.MicrosoftAppId || '',
      appPassword: process.env.MicrosoftAppPassword || '',
    });

// Catch adapter errors so the process does not exit
adapter.onTurnError = async (context, error) => {
  console.error('[Adapter] onTurnError:', error);
  await context.sendActivity(
    'The bot encountered an error. Please try again later.'
  );
};

// Create bot instance
const bot = new EchoBot();

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();

// Parse JSON bodies (required for Bot Framework)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check for Azure App Service and load balancers
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Echo Bot is running' });
});

// Bot Framework messaging endpoint
app.post('/api/messages', async (req, res) => {
  try {
    await adapter.process(req, res, (context) => bot.run(context));
  } catch (err) {
    console.error('[Express] POST /api/messages error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Echo Bot listening on port ${PORT}`);
  console.log(`Messaging endpoint: http://localhost:${PORT}/api/messages`);
});
