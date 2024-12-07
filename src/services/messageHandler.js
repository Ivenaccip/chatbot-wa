import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import openAiService from './openAiService.js';

class MessageHandler {
  // senderInfo viene de nuestro webhookController
  // Para solicitar información al usuario, vamos a usar un Constructor
  constructor() {
    this.appointmenState = {};
    this.assistandState = {};
  }

  async handleIncomingMessage(message, senderInfo) {

    console.log("Processing incoming message:", message);
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();
      const mediaFile = ['audio', 'imagen', 'video', 'pdf'];
      if(this.isGreeting(incomingMessage)){
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      } else if(mediaFile.includes(incomingMessage)) {
        await this.sendMedia(message.from, incomingMessage);
      } else if (this.appointmenState[message.from]) {
        await this.handleAppointmentFlow(message.from, incomingMessage, message.id);
      } else if(this.assistandState[message.from]){
        await this.handleAssistantFlow(message.from, incomingMessage, message.id);
      } else {
        await this.handleMenuOption(message.from, incomingMessage);
      }
  
      console.log("Marking message as read...");
      await whatsappService.markAsRead(message.id);
    } else if (message?.type == 'interactive') {
      const option = message?.interactive?.button_reply?.id;
      await this.handleMenuOption(message.from, option, message.id);
      await whatsappService.markAsRead(message.id);
    }
  }
  
  // Estamos pasando los saludos
  isGreeting(message) {
    // Por cada uno de los elementos en la lista podemos crear un flujo. Así el bot termina siendo personalidad
    // No necesitamos que los elemetos del greeting estén en mayúsculas, porque para eso estamos usando incomingMessage 
    if (typeof message !== 'string') {
      console.error("Invalid message format for isGreeting:", message);
      return false;
    }
    
    const greetings = ["hola", "hello", "hi", "buenos días", "buenas tardes"];
    // Vamos a checar si el mensaje incluye alguna de estás palabras o frases
    return greetings.some(greeting => message.includes(greeting)); // Nos va a retornar un booleano (V/F)
  }

  getSenderName(senderInfo) {
    return senderInfo.profile?.name || senderInfo.wa_id; // También podemos personalizar como nombrarlos solo con ||  "nombramiento"
  }

  // to es el usuario identificador, compuesto por la lada del usuario y su número de whats app
  // ! no sesi message_id es el correcto
  async sendWelcomeMessage(to, message_id, senderInfo) {
    // Recuperamos el nombre
    // console.log("SenderInfo text", senderInfo, senderInfo?.type)
    // Estamos recuperado SenderInfo text { profile: { name: 'G. Leo' }, wa_id: '5215580129436' }
    const name = this.getSenderName(senderInfo)
    // Estructuramos el mensaje de bievenida
    const welcomeMessage = `Hola ${name}, Bienvenido a MEDPET, tu tienda de mascostas en línea. ¿En qué puedo ayudarte hoy?`;
    // Esperamos a hacer la solicitud a Whats App service
    await whatsappService.sendMessage(to, welcomeMessage, message_id);
  }

  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una opción:";
    const buttons = [
      {
        type: "reply",
        reply: {
          id: "option_1",
          title: "Agendar",
        },
      },
      {
        type: "reply",
        reply: {
          id: "option_2",
          title: "Consultar",
        },
      },
      {
        type: "reply",
        reply: {
          id: "option_3",
          title: "Ubicación",
        },
      },
    ];
  
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option, message_id) {
    
    let response;
    switch (option) {
      case 'option_1':
        this.appointmenState[to] = {step: 'name'};
        response = "Por favor, ingresa tu nombre: ";
        break;
      case 'option_2':
        this.assistandState[to] = {step: 'question'};
        response = "Realiza tu consulta";
        break;
      // Cuidado con el acento, porque podría romper la aplicación
      case 'option_3':
        response = "Te esperamos en nuestra sucursal";
        await this.sendLocation(to);
        break;
      case 'option_6':
        response = "Si esto es una emergencia, te invitamos a llamar a nuestra línea de atención"
        await this.sendContact(to);
        break;
      default:
        response = "Lo siento, no entendí tu selección. Por favor, elige una de las opciones del menu"
    }
    await whatsappService.sendMessage(to, response, message_id);
  }

  async sendMedia(to, mediaFile) {
    if (typeof mediaFile !== 'string') {
      console.error("Invalid format for sendMedia:", mediaFile);
      return false;
    }
  
    // Mapa de configuraciones para los diferentes tipos de media
    const mediaConfig = {
      audio: {
        mediaUrl: 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac',
        caption: 'Bienvenida',
        type: 'audio',
      },
      imagen: {
        mediaUrl: 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png',
        caption: 'Imagen',
        type: 'image',
      },
      video: {
        mediaUrl: 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4',
        caption: 'Video',
        type: 'video',
      },
      pdf: {
        mediaUrl: 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf',
        caption: 'PDF',
        type: 'document',
      },
    };
  
    // Verificar si el tipo de media es válido
    const media = mediaConfig[mediaFile];
    if (!media) {
      console.error("Invalid media type:", mediaFile);
      return false;
    }
  
    const { mediaUrl, caption, type } = media;
  
    // Enviar el mensaje usando whatsappService
    // Para poder mandarlo, vamos a necesitar un manejador de contenido, el cual va a estar instalado en la nube y nos va a dar un url para acceder
    // Por ejemplo el profesor lo esta haciendo en un amazon S3
    try {
      await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
      console.log("Media sent successfully!");
    } catch (error) {
      console.error("Error sending media:", error.message);
    }
  }

  completeAppointment(to) {
    // Queremos que se haga una copia del elemento del constructor
    const appointment = this.appointmenState[to];
    // Estamos liberando la memoria
    delete this.appointmenState[to];

    const userData = [
      to,
      appointment.name,
      appointment.petName,
      appointment.petType,
      appointment.reason,
      // Estamos guardando el día de hoy
      new Date().toISOString()
    ]

    appendToSheet(userData);

    return `Gracias, por agendar tu cita.
    Resumen de tu cita:
    
    Nombre: ${appointment.name}
    Nombre de la mascota: ${appointment.petName}
    Tipo de mascota: ${appointment.petType}
    Motivo: ${appointment.reason}
    
    Nos pondremos en contacto contigo pronto, para confirmar la fecha y hora de tu cita.`
  }

  async handleAppointmentFlow(to, message, message_id) {
    const state = this.appointmenState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        // state.step nos va a indicar cual es el siguiente paso
        state.step = 'petName';
        response = "Gracias, ahora, ¿Cuál es el nombre de tu mascota?"
        break;

      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = "¿Qué tipo de mascota es? (Ej: Perro, gato, hurón)"
        break;
      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = "¿Cuál es el motivo de la consulta?"
        break;
      case 'reason':
        state.reason = message;
        response = this.completeAppointment(to);
        break;
    }
    await whatsappService.sendMessage(to, response, message_id);
  }

  async handleAssistantFlow(to, message, message_id) {
    const state = this.assistandState[to];
    let response;

    const menuMessage = "¿La respuesta fue de ayuda?";
    const buttons = [
      // Su estructura incluye 
      {type: 'reply', reply: {id: 'option_4', title: "Sí, gracias"}},
      {type: 'reply', reply: {id: 'option_5', title: "Hacer otra pregunta"}},
      {type: 'reply', reply: {id: 'option_6', title: "Emergencia"}}
    ]

    if (state.step === 'question') {
      response = await openAiService(message);
    }

    delete this.assistandState[to];
    await whatsappService.sendMessage(to, response, message_id);
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons, message_id);
  }

  async sendContact(to, message_id) {
    const contact = {
      addresses: [
        {
          street: "123 Calle de las Mascotas",
          city: "Ciudad",
          state: "Estado",
          zip: "12345",
          country: "País",
          country_code: "PA",
          type: "WORK"
        }
      ],
      emails: [
        {
          email: "contacto@medpet.com",
          type: "WORK"
        }
      ],
      name: {
        formatted_name: "MedPet Contacto",
        first_name: "MedPet",
        last_name: "Contacto",
        middle_name: "",
        suffix: "",
        prefix: ""
      },
      org: {
        company: "MedPet",
        department: "Atención al Cliente",
        title: "Representante"
      },
      phones: [
        {
          phone: "+1234567890",
          wa_id: "1234567890",
          type: "WORK"
        }
      ],
      urls: [
        {
          url: "https://www.medpet.com",
          type: "WORK"
        }
      ]
    };

    await whatsappService.sendContactMessage(to, contact, message_id);
  }

  async sendLocation(to) {
    // Necesitamos latitud, longitud, nombre y dirección
    const latitude = 6.2071694;
    const longitude = -75.574607;
    const name = 'Platzi Medellín';
    const address = 'Cra. 43A $5A - 113, El Poblado Medellín, Antioquia'

    await whatsappService.sendLocationMessage(to, latitude, longitude, name, address);
  }
  

}
export default new MessageHandler();