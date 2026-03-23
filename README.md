# Echo Bot for Microsoft Teams

Production-ready Echo Bot built with **Node.js**, **Bot Framework SDK v4**, and **Express**. It echoes every message it receives in 1:1 chat and channel conversations and is designed to run in Microsoft Teams.

---

## Table of Contents

- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Azure Bot resource and registration](#azure-bot-resource-and-registration)
- [Getting Microsoft App ID and Password](#getting-microsoft-app-id-and-password)
- [Configuring the messaging endpoint](#configuring-the-messaging-endpoint)
- [Testing locally with Bot Framework Emulator](#testing-locally-with-bot-framework-emulator)
- [Microsoft Teams manifest and sideloading](#microsoft-teams-manifest-and-sideloading)
- [Deploying to Azure App Service](#deploying-to-azure-app-service)
- [Azure CLI deployment commands](#azure-cli-deployment-commands)
- [Environment variables reference](#environment-variables-reference)

---

## Project structure

```
Echo BOT/
├── .env                 # Your secrets (create from .env.example; do not commit)
├── .env.example         # Template for environment variables
├── .gitignore
├── package.json
├── index.js             # Express server and Bot Framework adapter
├── bot.js               # Echo bot logic (onMessage, onMembersAdded)
├── manifest/
│   ├── manifest.json    # Teams app manifest (sideloading)
│   ├── outline.png      # 32x32 outline icon (add yourself)
│   └── color.png        # 192x192 color icon (add yourself)
└── README.md
```

---

## Prerequisites

- **Node.js** 18 or later  
- **npm** (comes with Node.js)  
- **Azure subscription** (for Azure Bot, App Service, and Teams)  
- **Bot Framework Emulator** (optional, for local testing): [Download](https://github.com/Microsoft/BotFramework-Emulator/releases)  
- **Microsoft Teams** (desktop or web) for sideloading

---

## Local setup

1. **Clone or copy this project** and open a terminal in the project root.

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create your environment file:**

   ```bash
   copy .env.example .env
   ```

   (On macOS/Linux: `cp .env.example .env`.)

4. **Edit `.env`** and leave `MicrosoftAppId` and `MicrosoftAppPassword` empty for **Bot Framework Emulator** testing. For **Teams** or **production**, you must set them (see below).

5. **Run the bot:**

   ```bash
   npm start
   ```

   The bot listens on `http://localhost:3978` and exposes:

   - **Messaging endpoint:** `http://localhost:3978/api/messages`
   - **Health check:** `http://localhost:3978/api/health`

---

## Azure Bot resource and registration

You need an **Azure Bot** resource so Teams (and other channels) can talk to your bot.

### Create Azure Bot resource (Azure Portal)

1. Go to [Azure Portal](https://portal.azure.com) and sign in.
2. Click **Create a resource** and search for **Azure Bot**.
3. Click **Create**.
4. Fill in:
   - **Subscription:** your subscription  
   - **Resource group:** create new or use existing (e.g. `rg-echo-bot`)  
   - **Bot handle:** globally unique (e.g. `echo-bot-yourcompany`)  
   - **Pricing tier:** F0 (free) or S1  
   - **Microsoft App ID:** choose **Create new Microsoft App ID** (recommended)  
5. Click **Review + create**, then **Create**.

### Create Azure Bot resource (Azure CLI)

```bash
# Login and set subscription
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create resource group
az group create --name rg-echo-bot --location eastus

# Create the bot (use a unique bot handle)
az bot create --resource-group rg-echo-bot --name echo-bot-yourcompany --kind registration --location eastus
```

After creation, you still need to configure the **Messaging endpoint** and optionally create a **new Microsoft App ID** and **Client secret** (see next section).

---

## Getting Microsoft App ID and Password

The bot uses **Microsoft App ID** and a **Client secret** (password) for authentication.

### Option A: Created with the bot

If you chose **Create new Microsoft App ID** when creating the Azure Bot:

1. In Azure Portal, open your **Azure Bot** resource.
2. Go to **Configuration** (under Settings).
3. You will see **Microsoft App ID**.
4. To create a **client secret**:
   - Go to [Azure Portal – App registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
   - Open the app that has the same **Application (client) ID** as your bot.
   - **Certificates & secrets** → **New client secret** → add description, expiry → **Add**.
   - **Copy the secret Value immediately** (it is shown only once). This is your `MicrosoftAppPassword`.

### Option B: Create App Registration manually

1. Go to [Azure Portal – App registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) → **New registration**.
2. **Name:** e.g. `Echo Bot`.  
3. **Supported account types:** “Accounts in any organizational directory and personal Microsoft accounts” (multi-tenant).  
4. **Redirect URI:** leave blank.  
5. **Register**.
6. On the app’s **Overview** page, copy **Application (client) ID** → this is `MicrosoftAppId`.
7. **Certificates & secrets** → **New client secret** → copy the **Value** → this is `MicrosoftAppPassword`.

### Link App ID to Azure Bot (if you created the app separately)

1. Azure Portal → your **Azure Bot** resource → **Configuration**.
2. Set **Microsoft App ID** to the Application (client) ID from the app registration.
3. Save. When prompted, paste the **client secret** (Microsoft App Password).

### Set in your app

In `.env` (local) or in **App Service → Configuration → Application settings** (deployed):

```env
MicrosoftAppId=YOUR_APPLICATION_CLIENT_ID
MicrosoftAppPassword=YOUR_CLIENT_SECRET_VALUE
```

Never commit `.env` or the secret to source control.

---

## Configuring the messaging endpoint

The **messaging endpoint** is the URL where the Azure Bot sends activities (messages) to your app.

1. Azure Portal → your **Azure Bot** resource.
2. Go to **Configuration** (under Settings).
3. Set **Messaging endpoint** to your bot’s HTTPS URL, for example:
   - Local (with tunneling): `https://YOUR_NGROK_OR_OTHER_TUNNEL_URL/api/messages`
   - Production: `https://YOUR_APP_NAME.azurewebsites.net/api/messages`
4. Click **Apply**.

The endpoint **must**:

- Use **HTTPS** in production (and for Teams).
- Point to the path that serves the Bot Framework (e.g. `/api/messages`).

---

## Testing locally with Bot Framework Emulator

You can test the bot without Azure or Teams by using the Bot Framework Emulator and (optionally) a tunnel.

### Without Azure credentials (Emulator only)

1. In `.env`, leave `MicrosoftAppId` and `MicrosoftAppPassword` empty (or omit them).
2. Start the bot: `npm start`.
3. Open **Bot Framework Emulator**.
4. **Connect** to: `http://localhost:3978/api/messages`.
5. Leave **Microsoft App ID** and **Microsoft App Password** blank.
6. Send messages; the bot should echo them.

### With Azure credentials (same as production)

1. In `.env`, set `MicrosoftAppId` and `MicrosoftAppPassword` from your Azure Bot / App registration.
2. Start the bot: `npm start`.
3. In Emulator, connect to `http://localhost:3978/api/messages` and enter the same **Microsoft App ID** and **Microsoft App Password**.
4. Test the same way.

### Emulator tips

- Use **Restart conversation** to start a new thread.
- Check the Emulator log for errors if the bot doesn’t reply.

---

## Microsoft Teams manifest and sideloading

To use the bot inside Microsoft Teams, you package the **Teams app manifest** and icons and **sideload** the app into a team or for personal use.

### 1. Prepare the manifest

1. Open `manifest/manifest.json`.
2. Replace placeholders:
   - **`id`** (top-level): Replace `REPLACE_WITH_YOUR_APP_ID_GUID` with a **new GUID** (unique for the Teams app). Generate one at [https://www.guidgenerator.com](https://www.guidgenerator.com/) or use PowerShell: `[guid]::NewGuid()`.
   - **`botId`** (inside `bots[0]`): Replace `REPLACE_WITH_YOUR_MICROSOFT_APP_ID` with your bot’s **Microsoft App ID** (same as in `.env`).
   - **`developer`**: Set `name`, `websiteUrl`, `privacyUrl`, `termsOfUseUrl` to your own URLs.
3. Add **icons** in the `manifest` folder (same folder as `manifest.json`):
   - **outline.png:** 32x32 px, transparent PNG, white outline (for Teams UI).
   - **color.png:** 192x192 px, full color PNG (app icon).
   - You can use [Teams icon guidelines](https://learn.microsoft.com/en-us/microsoftteams/platform/concepts/design/design-teams-app-overview#icons) or any 32x32 and 192x192 PNGs for testing.

### 2. Create the app package (ZIP)

- Include **only** these files in the ZIP (paths inside ZIP must match):
  - `manifest.json`
  - `outline.png`
  - `color.png`
- The ZIP is your **Teams app package**.

Example (PowerShell, run from project root):

```powershell
cd manifest
Compress-Archive -Path manifest.json, outline.png, color.png -DestinationPath ../EchoBotTeams.zip
cd ..
```

### 3. Sideload the bot into Teams

1. Open **Microsoft Teams** (desktop or web).
2. **Apps** → **Manage your apps** → **Upload an app** → **Upload a custom app**.
3. Select `EchoBotTeams.zip`.
4. After upload, click **Add** to add the app for yourself (personal) and/or **Add to a team** to add it to a channel.

### 4. Test in Teams

- **1:1:** Open the app under **Apps** → **Echo Bot** → start a chat and send a message.
- **Channel:** In a team where the app was added, go to the channel → **Apps** → **Echo Bot** → use **Message the bot** or @mention the bot and send a message.

The bot must be **deployed and reachable** at the **messaging endpoint** you configured in the Azure Bot (e.g. Azure App Service URL with HTTPS). For local testing with Teams, use a tunnel (e.g. ngrok) and set that HTTPS URL as the messaging endpoint.

---

## Deploying to Azure App Service

Deploy the Node.js app to **Azure App Service** so the bot is available 24/7 with HTTPS.

### 1. Create App Service (Azure Portal)

1. Azure Portal → **Create a resource** → **Web App**.
2. **Subscription**, **Resource group** (e.g. same as bot: `rg-echo-bot`).
3. **Name:** e.g. `echo-bot-app` (must be globally unique in `.azurewebsites.net`).
4. **Publish:** Code. **Runtime stack:** Node 18 LTS or 20 LTS.
5. **Region:** same as your bot (e.g. East US).
6. **Create**.

### 2. Configure application settings

1. Open the **App Service** resource → **Configuration** → **Application settings**.
2. Add:
   - **MicrosoftAppId** = your bot’s Microsoft App ID  
   - **MicrosoftAppPassword** = your bot’s client secret (value only)
3. Save.

### 3. Set messaging endpoint

1. Open your **Azure Bot** resource → **Configuration**.
2. **Messaging endpoint:** `https://echo-bot-app.azurewebsites.net/api/messages` (replace with your App Service URL).
3. Apply.

### 4. Deploy code

- **Option A – VS Code:** Install “Azure App Service” extension, right-click project → **Deploy to Web App**.
- **Option B – Git:** Configure **Deployment Center** for the App Service (e.g. GitHub/Azure Repos) and deploy from your repo.
- **Option C – ZIP deploy:** From project root (with `node_modules` installed and no `.env`):

  ```bash
  npm install --production
  # Create zip of all files (including node_modules), then use Azure CLI or Portal to deploy the zip.
  ```

After deployment, open `https://YOUR_APP_NAME.azurewebsites.net/api/health` to confirm the bot is running.

---

## Azure CLI deployment commands

End-to-end example: create resource group, bot, App Service, and deploy.

```bash
# Variables (customize these)
RESOURCE_GROUP=rg-echo-bot
LOCATION=eastus
BOT_NAME=echo-bot-yourcompany
APP_NAME=echo-bot-app
APP_ID=YOUR_MICROSOFT_APP_ID
APP_PASSWORD=YOUR_MICROSOFT_APP_PASSWORD

# Login and subscription
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Azure Bot (registration type)
az bot create --resource-group $RESOURCE_GROUP --name $BOT_NAME --kind registration --location $LOCATION

# App Service plan and Web App (Node 18)
az appservice plan create --name plan-echo-bot --resource-group $RESOURCE_GROUP --location $LOCATION --sku B1 --is-linux
az webapp create --resource-group $RESOURCE_GROUP --plan plan-echo-bot --name $APP_NAME --runtime "NODE:18-lts"

# App settings (use your real App ID and Password)
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings \
  MicrosoftAppId=$APP_ID \
  MicrosoftAppPassword="$APP_PASSWORD"

# Messaging endpoint on the bot
az bot update --resource-group $RESOURCE_GROUP --name $BOT_NAME --endpoint "https://$APP_NAME.azurewebsites.net/api/messages"

# Deploy from local folder (run from project root; requires zip and az webapp deploy)
# Install dependencies first
npm install --production
zip -r deploy.zip . -x "*.git*" -x "node_modules/.cache/*"
az webapp deploy --resource-group $RESOURCE_GROUP --name $APP_NAME --src-path deploy.zip --type zip
```

On Windows (PowerShell), to create the zip without `.env` and without committing secrets:

```powershell
# From project root; ensure .env is not in the zip
Compress-Archive -Path * -DestinationPath deploy.zip -Force
az webapp deploy --resource-group $RESOURCE_GROUP --name $APP_NAME --src-path deploy.zip --type zip
```

(Exclude `node_modules` if not needed in the zip and use **Deployment Center** or **npm install** on the server instead, depending on your setup.)

---

## Environment variables reference

| Variable                 | Required | Description |
|--------------------------|----------|-------------|
| `MicrosoftAppId`         | Yes (Teams/production) | Azure Bot / App registration Application (client) ID. |
| `MicrosoftAppPassword`   | Yes (Teams/production) | Client secret value from App registration. |
| `PORT`                   | No       | Server port. Default `3978`. Azure App Service sets this automatically. |

All secrets must be stored in environment variables (or Azure App Service Application settings), never in code or in committed files.

---

## Summary checklist

- [ ] Node.js 18+ and dependencies installed (`npm install`)
- [ ] `.env` created from `.env.example`; for production/Teams, `MicrosoftAppId` and `MicrosoftAppPassword` set
- [ ] Azure Bot resource created and configured
- [ ] Microsoft App ID and client secret created and linked to the bot
- [ ] Messaging endpoint set to your app’s `/api/messages` URL (HTTPS in production)
- [ ] For Teams: `manifest/manifest.json` updated (id, botId, developer) and icons added; package ZIP created and sideloaded
- [ ] For production: App Service created, application settings set, code deployed, messaging endpoint updated
- [ ] Local testing: Bot Framework Emulator pointed at `http://localhost:3978/api/messages`

This gives you a complete, production-ready Echo Bot for Microsoft Teams with clear steps for Azure, registration, deployment, and sideloading.
