/**
 * Echo Bot - Bot Framework SDK v4
 * Handles incoming messages and echoes them back in 1:1 chat and channels.
 */

const { ActivityHandler } = require('botbuilder');

class EchoBot extends ActivityHandler {
  constructor() {
    super();

    // Handle incoming messages (1:1 chat and channel messages)
    this.onMessage(async (context, next) => {
      try {
        const text = context.activity.text?.trim() || '';
        const attachments = context.activity.attachments?.length
          ? ` (${context.activity.attachments.length} attachment(s))`
          : '';

        // Echo the same message back; include attachment note if present
        const replyText = text
          ? `Echo: ${text}${attachments}`
          : attachments
            ? `Echo: [message with${attachments}]`
            : "I didn't receive any text. Send a message and I'll echo it back.";

        await context.sendActivity(replyText);
      } catch (err) {
        console.error('[EchoBot] onMessage error:', err);
        await context.sendActivity(
          'Sorry, something went wrong while processing your message.'
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
            'Hello! I am an Echo Bot. Send any message and I will reply with the same message.'
          );
          break;
        }
      }

      await next();
    });
  }
}

module.exports.EchoBot = EchoBot;
