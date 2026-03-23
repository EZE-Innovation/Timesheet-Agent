/**
 * Timesheet Bot - Bot Framework SDK v4
 * Forwards incoming messages to Flowise AI agent for Workday timesheet management.
 */

const { ActivityHandler, MessageFactory } = require('botbuilder');
const axios = require('axios');

const FLOWISE_URL = process.env.FLOWISE_URL;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

class TimesheetBot extends ActivityHandler {
  constructor() {
    super();

    // Handle incoming messages (1:1 chat and channel messages)
    this.onMessage(async (context, next) => {
      try {
        const userMessage = context.activity.text?.trim() || '';
        const userId = context.activity.from.id;

        if (!userMessage) {
          await context.sendActivity(
            "I didn't receive any text. Try asking me to log, update, or submit your timesheet."
          );
          await next();
          return;
        }

        // Show typing indicator while Flowise processes
        await context.sendActivity({ type: 'typing' });

        // Forward message to Flowise
        const response = await axios.post(
          FLOWISE_URL,
          {
            question: userMessage,
            sessionId: userId  // maintains separate memory per Teams user
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${FLOWISE_API_KEY}`
            },
            timeout: 60000  // 60s — allows time for multi-tool chains
          }
        );

        const reply =
          response.data.text ||
          response.data.answer ||
          response.data.output ||
          "Sorry, I couldn't process that request. Please try again.";

        await context.sendActivity(MessageFactory.text(reply));

      } catch (err) {
        console.error('[TimesheetBot] onMessage error:', err.message);
        await context.sendActivity(
          'Sorry, something went wrong while processing your message. Please try again.'
        );
      }

      await next();
    });

    // Handle members added (e.g. bot added to channel or 1:1 chat)
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded || [];
      const botId = context.activity.recipient?.id;

      for (const member of membersAdded) {
        if (member.id !== botId) {
          await context.sendActivity(
            'Hi! I am your Workday Timesheet Assistant. I can help you log, update, and submit your timesheets. How can I help you today?'
          );
          break;
        }
      }

      await next();
    });
  }
}

module.exports.TimesheetBot = TimesheetBot;
