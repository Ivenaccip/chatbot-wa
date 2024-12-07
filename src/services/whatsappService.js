import axios from 'axios';
import config from '../config/env.js';

const cleanPhoneNumber = (number) => {
  // Limpia el número de teléfono para asegurarse de que está en el formato correcto
  return number.startsWith('521') ? number.replace('521', '52') : number;
};

class WhatsAppService {
  // Nos manda un mensaje
  async sendMessage(to, body, messageId) {
    try {
      const cleanedTo = cleanPhoneNumber(to); // Limpia el número de teléfono
      const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`; // Corregido aquí
      const data = {
        messaging_product: 'whatsapp',
        to: cleanedTo,
        text: { body },
        context: { message_id: messageId },
      };

      console.log('API Endpoint:', url);
      console.log('Request Body:', JSON.stringify(data, null, 2));

      const response = await axios({
        method: 'POST',
        url,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`, // El token va como encabezado
          'Content-Type': 'application/json',
        },
        data,
      });
      console.log('Message sent successfully!', response.data);
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
    }
  }

  // Nos marca como leídos los mensajes
  async markAsRead(messageId) {
    try {
      const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`; // Corregido aquí
      const data = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      console.log('Marking as read API Endpoint:', url);
      console.log('Request Body:', JSON.stringify(data, null, 2));

      const response = await axios({
        method: 'POST',
        url,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`, // El token va como encabezado
          'Content-Type': 'application/json',
        },
        data,
      });
      console.log('Message marked as read successfully!', response.data);
    } catch (error) {
      console.error('Error marking message as read:', error.response?.data || error.message);
    }
  }

  // Estamos integrando una opción de botones, solo podemos un máximo de 3
  async sendInteractiveButtons(to, bodyText, buttons) {
    try {
      const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
  
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
  
      console.log("Interactive Buttons API Endpoint:", url);
      console.log("Request Body:", JSON.stringify(data, null, 2));
  
      const response = await axios({
        method: "POST",
        url,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`, // Token de acceso
          "Content-Type": "application/json",
        },
        data,
      });
  
      console.log("Interactive buttons sent successfully!", response.data);
    } catch (error) {
      console.error("Error sending interactive buttons:", error.response?.data || error.message);
    }
  }

  async sendMediaMessage(to, type, mediaUrl, caption) {
    try {
      const mediaObject = {};

      switch (type) {
        case 'image':
          mediaObject.image = { link: mediaUrl, caption:caption }
          break;

        case 'audio':
          mediaObject.audio = { link: mediaUrl }
          break;

        case 'video':
          mediaObject.video = { link: mediaUrl, caption:caption }
          break;
        case 'document':
          mediaObject.document = { link: mediaUrl, caption:caption, __filename: 'medpet.pdf' } // Podemos especificar el nombre del documento que queremos entregar
          break;

        // Este esta en caso de que nos mande algo además de los formatos que estamos mencionando
        default:
          throw new Error('Not Sopoted Media Type');
          break;  
      }

      const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
  
      const data = {
        messaging_product: 'whatsapp',
        to: cleanPhoneNumber(to),
        type: type,
        ...(type === 'audio' && { audio: { link: mediaUrl } }),
        ...(type === 'image' && { image: { link: mediaUrl, caption: caption } }),
        ...(type === 'video' && { video: { link: mediaUrl, caption: caption } }),
        ...(type === 'document' && { document: { link: mediaUrl, caption: caption, filename: 'medpet.pdf' } }),
      };

      const media_alert = await axios({
        method: "POST",
        url,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`, // Token de acceso
          "Content-Type": "application/json",
        },
        data,
      });

      console.log("Interactive buttons sent successfully!", media_alert.data);
    } catch (error) {
      console.error("Error sending media:", error.response?.data || error.message);
    }
  

    } catch (error) {
      console.error(error);
    }

  async sendContactMessage(to, contact) {
    
    try {
      const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;

      const data = {
        messaging_product: 'whatsapp',
        to: cleanPhoneNumber(to),
        type: 'contacts',
        contacts: [contact]
      };

      const media_alert = await axios({
        method: "POST",
        url,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`, // Token de acceso
          "Content-Type": "application/json",
        },
        data,
      });
    } catch (error) {
      console.error(error);
    }
  }

  // Configura el body antes de mandarlo
  async sendTemplateMessage(to, templateName, languageCode) {
    try {
      const cleanedTo = cleanPhoneNumber(to); // Limpia el número de teléfono
      const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`; // Corregido aquí
      const data = {
        messaging_product: 'whatsapp',
        to: cleanedTo,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
        },
      };

      console.log('Template Message API Endpoint:', url);
      console.log('Request Body:', JSON.stringify(data, null, 2));

      const response = await axios({
        method: 'POST',
        url,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`, // El token va como encabezado
          'Content-Type': 'application/json',
        },
        data,
      });
      console.log('Template message sent successfully!', response.data);
    } catch (error) {
      console.error('Error sending template message:', error.response?.data || error.message);
    }
  }

  async sendLocationMessage(to, latitude, longitude, name, address) {
    try {
      const url = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
  
      const data = {
        messaging_product: 'whatsapp',
        to: cleanPhoneNumber(to),
        type: 'location',
        location: {
          latitude: latitude,
          longitude: longitude,
          name: name,
          address: address
        }
      };

      const media_alert = await axios({
        method: "POST",
        url,
        headers: {
          Authorization: `Bearer ${config.API_TOKEN}`, // Token de acceso
          "Content-Type": "application/json",
        },
        data,
      });
    } catch (error) {
      console.error(error);
    }
  }

}

console.log('Using the following configuration:');
console.log('API Version:', config.API_VERSION);
console.log('Business Phone:', config.BUSINESS_PHONE);
console.log('API Token:', config.API_TOKEN.substring(0, 20) + '...'); // Por seguridad, solo muestra los primeros caracteres del token

export default new WhatsAppService();
