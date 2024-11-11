const axios = require('axios');
const FormData = require('form-data');
const path = require('path'); // Importa el módulo 'path'
const fs = require('fs'); // Importa el módulo 'fs' para manejar el sistema de archivos

async function getZimbraAuthToken() {
  const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
      <soap:Header>
        <context xmlns="urn:zimbra">
          <authToken/>
        </context>
      </soap:Header>
      <soap:Body>
        <AuthRequest xmlns="urn:zimbraAccount">
          <account by="name">prueba_zimbra@asesoresgayosso.com</account>
          <password>Gayosso2024#</password>
        </AuthRequest>
      </soap:Body>
    </soap:Envelope>`;

  try {
    const response = await axios.post('https://mail.asesoresgayosso.com/service/soap', soapRequest, {
      headers: { 'Content-Type': 'application/xml' },
    });

    const authTokenMatch = response.data.match(/<authToken>(.*?)<\/authToken>/);
    if (authTokenMatch) {
      return authTokenMatch[1];
    } else {
      throw new Error('No se pudo obtener el token de autenticación.');
    }
  } catch (error) {
    console.error('Error al obtener el token de autenticación:', error);
    return null;
  }
}

function formatDateTime(dateObj, hour, minute) {
  const { year, month, date } = dateObj;
  const formattedMonth = (month + 1).toString().padStart(2, '0');
  const formattedDate = date.toString().padStart(2, '0');
  const formattedHour = hour.toString().padStart(2, '0');
  const formattedMinute = minute.toString().padStart(2, '0');

  return `${year}${formattedMonth}${formattedDate}T${formattedHour}${formattedMinute}00`;
}

async function createEventInZimbra(eventData) {
  const url = 'https://mail.asesoresgayosso.com/service/home/prueba_zimbra@asesoresgayosso.com/calendar';

  const newEventICS = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Zimbra//NONSGML Zimbra Calendar//EN
BEGIN:VEVENT
SUMMARY:${eventData.summary}
DTSTART;TZID=America/Mexico_City:${formatDateTime(eventData.startDate, eventData.startHour, eventData.startMinute)}
DTEND;TZID=America/Mexico_City:${formatDateTime(eventData.endDate, eventData.endHour, eventData.endMinute)}
LOCATION:${eventData.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  // Definir la ruta para guardar 'calendario.ics' en la carpeta antes de la actual
  const calendarPath = path.join(__dirname, 'temp', 'calendario.ics');

  // Guardar el archivo ICS en el sistema de archivos
  fs.writeFileSync(calendarPath, newEventICS, 'utf-8');

  const formData = new FormData();
  formData.append('file', fs.createReadStream(calendarPath), {
    filename: 'calendario.ics',
    contentType: 'text/calendar'
  });
  formData.append('fmt', 'ics');

  try {
    const authToken = await getZimbraAuthToken();
    if (!authToken) {
      throw new Error('Error obteniendo el token de autenticación.');
    }
    const response = await axios.post(url, formData, {
      headers: {
        'Cookie': `ZM_AUTH_TOKEN=${authToken}`,
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        ...formData.getHeaders(),
      },
    });

    if (response.status === 200) {
      return { exitoso: true };
    } else {
      console.error('Error al crear el evento:', response.data);
      return { exitoso: false, error: response.statusText };
    }
  } catch (error) {
    console.error('Error al realizar la solicitud:', error);
    return { exitoso: false, error: error.message };
  }
}

exports.main = async (context) => {
  console.log("Parameters:", context.parameters);

  const { parameters } = context;
  return await createEventInZimbra(parameters);
};
