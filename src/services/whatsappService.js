import sendToWhatsApp from '../services/httpRequest/sendToWhatsApp.js';
import config from '../config/env.js'

const cleanPhoneNumber = (number) => {
  // Limpia el número de teléfono para asegurarse de que está en el formato correcto
  return number.startsWith('521') ? number.replace('521', '52') : number;
};

class WhatsAppService {
  // Nos manda un mensaje
  async sendMessage(to, body, messageId) {
    const data = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber(to),
      text: { body },
      ...(messageId && { context: { message_id: messageId } }) // Agrega context si messageId está definido
    };
    await sendToWhatsApp(data);
  }

  // Nos marca como leídos los mensajes
  async markAsRead(messageId) {
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };
    await sendToWhatsApp(data);
  }

  // Estamos integrando una opción de botones, solo podemos un máximo de 3
  async sendInteractiveButtons(to, bodyText, buttons) {
    const data = {
      messaging_product: "whatsapp",
      to: cleanPhoneNumber(to),
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons,
        },
      },
    };
    await sendToWhatsApp(data);
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    const data = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber(to),
      type: type,
      ...(type === 'audio' && { audio: { link: mediaUrl } }),
      ...(type === 'image' && { image: { link: mediaUrl, caption } }),
      ...(type === 'video' && { video: { link: mediaUrl, caption } }),
      ...(type === 'document' && { document: { link: mediaUrl, caption, filename: 'medpet.pdf' } }),
    };
    await sendToWhatsApp(data);
  }

  async sendContactMessage(to, contact) {
    const data = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber(to),
      type: 'contacts',
      contacts: [contact],
    };
    await sendToWhatsApp(data);
  }

  // Configura el body antes de mandarlo
  async sendTemplateMessage(to, templateName, languageCode) {
    const data = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber(to),
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };
    await sendToWhatsApp(data);
  }

  async sendLocationMessage(to, latitude, longitude, name, address) {
    const data = {
      messaging_product: 'whatsapp',
      to: cleanPhoneNumber(to),
      type: 'location',
      location: {
        latitude,
        longitude,
        name,
        address,
      },
    };
    await sendToWhatsApp(data);
  }
}

console.log('Using the following configuration:');
console.log('API Version:', config.API_VERSION);
console.log('Business Phone:', config.BUSINESS_PHONE);
console.log('API Token:', config.API_TOKEN.substring(0, 20) + '...'); // Por seguridad, solo muestra los primeros caracteres del token

export default new WhatsAppService();
