# Azure Speech API Key Setup

This app uses Azure AI Speech for Hebrew text-to-speech in the Read Aloud panel.
The server route reads credentials from `.env` and calls the Microsoft Speech SDK
with a subscription key and region.

## What The App Needs

Add these values to `.env`:

```env
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=your-resource-region
AZURE_SPEECH_VOICE_NAME=he-IL-HilaNeural
```

`AZURE_SPEECH_VOICE_NAME` is optional. If it is omitted, the app defaults to
`he-IL-HilaNeural`.

The app does not currently need the Azure endpoint URL. It uses the Speech SDK
with `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`.

## Create A New Key From A New Microsoft Account

Use these steps after you have created or added an Azure subscription under the
new Microsoft account.

1. Sign in to the Azure Portal with the new Microsoft account:
   https://portal.azure.com
2. Confirm you are in the right directory and subscription.
   - Open the portal settings gear in the top-right.
   - Go to `Directories + subscriptions`.
   - Switch to the directory that contains the new subscription if needed.
   - Make sure subscription filters are not hiding the subscription.
3. Create a Speech-capable Azure AI resource.
   - Search for `Foundry`, `Azure AI services`, or `Speech`.
   - Microsoft currently lists the recommended resource as `Foundry > Foundry`
     with API kind `AIServices`.
   - Direct create link:
     https://portal.azure.com/#create/Microsoft.CognitiveServicesAIFoundry
4. Fill out the resource form.
   - `Subscription`: choose the new subscription.
   - `Resource group`: create one, for example `sela-speech-rg`.
   - `Region`: choose a Speech-supported region, for example `westus`,
     `westus2`, or `eastus`.
   - `Name`: choose a descriptive name, for example `sela-speech`.
   - `Pricing tier`: choose the free or lowest available tier if offered;
     otherwise use `S0`.
5. Select `Review + create`, then `Create`.
6. When deployment finishes, select `Go to resource`.
7. Open `Keys and Endpoint`.
8. Copy one of the generated keys, usually `Key 1`, and copy the region/location.
9. Update `.env`:

```env
AZURE_SPEECH_KEY=paste-key-1-or-key-2-here
AZURE_SPEECH_REGION=westus2
AZURE_SPEECH_VOICE_NAME=he-IL-HilaNeural
```

10. Restart the Next.js dev server or deployment so it reads the new `.env`
    values.

## Important Notes

- Azure Speech keys are region-specific. The `AZURE_SPEECH_REGION` value must
  match the region of the resource that generated the key.
- Use the region identifier, not the display name. For example, use `westus2`,
  not `West US 2`.
- Do not commit real keys. Keep them in `.env` locally and in secret settings for
  deployed environments.
- Azure creates two keys per resource. You can use either key. Having two keys
  lets you rotate credentials without downtime.
- If the app says Azure Speech is not configured, check that both
  `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are present and restart the app.
- If Azure returns an authentication error, the most common cause is a key and
  region mismatch.

## Verify In This App

After restarting the app:

1. Open a study.
2. Select a word, multiple words, or a strophe.
3. Open the `Sounds` panel.
4. Under `Read Aloud`, the message should say Azure Speech is being used for
   Hebrew playback.

The availability check is handled by `GET /api/tts/azure`. Actual synthesis is
handled by `POST /api/tts/azure`.

## Reference Links

- Create a Foundry resource:
  https://learn.microsoft.com/en-us/azure/ai-services/multi-service-resource?tabs=speech
- Azure Speech text-to-speech quickstart:
  https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-text-to-speech
- Azure Speech supported regions:
  https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions
- Azure API key rotation:
  https://learn.microsoft.com/en-us/azure/ai-services/rotate-keys
