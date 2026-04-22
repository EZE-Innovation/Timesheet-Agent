/**
 * Timesheet Bot - Bot Framework SDK v4
 * Forwards incoming messages to Flowise AI agent for Workday timesheet management.
 */

const { ActivityHandler, MessageFactory } = require('botbuilder');
const axios = require('axios');

const FLOWISE_URL = process.env.FLOWISE_URL;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

const getGraphToken = async () => {
  const res = await axios.post(
    `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials"
    })
  );
  return res.data.access_token;
};

const getUserEmail = async (aadObjectId) => {
  const token = await getGraphToken();

  const res = await axios.get(
    `https://graph.microsoft.com/v1.0/users/${aadObjectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data.mail || res.data.userPrincipalName;
};

const getUserDetails = async (aadObjectId) => {
  const token = await getGraphToken();

  const res = await axios.get(
    `https://graph.microsoft.com/v1.0/users/${aadObjectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return {
    email: res.data.mail || res.data.userPrincipalName,
    name: res.data.displayName
  };
};

class TimesheetBot extends ActivityHandler {
  constructor() {
    super();

    // Handle incoming messages (1:1 chat and channel messages)
    this.onMessage(async (context, next) => {
      try {
        const userMessage = context.activity.text?.trim() || '';
        console.log("FULL USER OBJECT:", context.activity.from);
        const userId = context.activity.from.aadObjectId;
        const userDetails = await getUserDetails(userId);
        const userEmail = userDetails.email;
        const userName = userDetails.name;
        console.log("User Email:", userEmail);
        console.log("User Name:", userName);

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
        console.log("Sending to Flowise:", {
          question: userMessage,
          email: userEmail
        });
        const response = await axios.post(
          'https://flowise-app.wonderfuldesert-67959724.southindia.azurecontainerapps.io/api/v1/prediction/a3f2912a-564a-4317-872b-6eb079a2a831',
          {
            question: userMessage,
            email: userEmail,
            name: userName
          },
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );

        const botReply = response.data?.text || "No response from assistant";
        const finalReply = userName
          ? `Hi ${userName.split(' ')[0]}, ${botReply}`
          : botReply;
        await context.sendActivity(finalReply);

      } catch (err) {
        console.error('[TimesheetBot] onMessage error:', err.message);
        await context.sendActivity(
          "Sorry, I’m unable to process your request right now."
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
