# WhatsApp Bootstrap API

A lightweight WhatsApp Web API built with [wwebjs](https://github.com/pedroslopez/whatsapp-web.js), designed for easy bootstrapping and automation.

## Features

- Connects to WhatsApp Web using `wwebjs`
- Exposes RESTful APIs for sending messages
- Automatically generates QR code for authentication
- Supports session persistence

## Requirements

- Node.js 18+
- Google Chrome or Chromium (for Puppeteer)
- WhatsApp account

## Installation

```bash
git clone https://github.com/hakimamarullah/whatsapp-bootstrap-api.git
cd whatsapp-bootstrap-api
npm install
````

## Running the API

```bash
npm start
```

When running for the first time, a **QR code** will appear in the terminal. Scan it using your WhatsApp mobile app.

## API Endpoints

### Send a Message

```http
POST /wa/send
Content-Type: application/json

{
  "to": "1234567890", // include country code, no plus (+)
  "message": "Hello from the API!"
}
```


## Notes

* Sessions are stored in a local `.wwebjs_auth` folder
* Restart the server without needing to re-scan QR
