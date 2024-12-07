import config from '../config/env.js';
import messageHandler from '../services/messageHandler.js';

class WebhookController {
  async handleIncoming(req, res) {
    try {
      console.log("Webhook POST endpoint hit with payload:", req.body);

      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      // Verificar si el evento incluye mensajes y contactos
      if (!changes?.messages || !changes?.contacts) {
        console.log("Non-message event received, ignoring:", req.body);
        return res.sendStatus(200); // Ignora eventos no relevantes
      }

      const message = changes.messages[0];
      const senderInfo = changes.contacts[0];

      console.log("Parsed message:", message);
      console.log("Sender info:", senderInfo);

      // Procesar mensaje si está disponible
      if (message && senderInfo) {
        await messageHandler.handleIncomingMessage(message, senderInfo);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.sendStatus(500);
    }
  }

  verifyWebhook(req, res) {
    try {
      console.log("Webhook GET verification endpoint hit with query:", req.query);

      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode === 'subscribe' && token === config.WEBHOOK_VERIFY_TOKEN) {
        console.log("Webhook verified successfully!");
        return res.status(200).send(challenge);
      }

      console.log("Webhook verification failed.");
      res.sendStatus(403);
    } catch (error) {
      console.error("Error verifying webhook:", error);
      res.sendStatus(500);
    }
  }
}

export default new WebhookController();
