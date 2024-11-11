const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ical = require('ical.js');

// Obtener token de autenticación de Zimbra
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

// Exportar el calendario desde Zimbra y devolver eventos
async function exportZimbraCalendar(authToken) {
  try {
    const response = await axios.get(`https://mail.asesoresgayosso.com/home/prueba_zimbra@asesoresgayosso.com/calendar?fmt=ics`, {
      headers: {
        'Cookie': `ZM_AUTH_TOKEN=${authToken}`,
      },
      responseType: 'blob',
    });

    const calendarPath = path.join(__dirname, 'temp', 'calendario.ics');
    console.log('path', calendarPath);
    console.log("Directorio actual:", process.cwd());

    
    fs.writeFileSync(calendarPath, response.data);

    const data = fs.readFileSync(calendarPath, 'utf8');

    const jcalData = ical.parse(data);
    const comp = new ical.Component(jcalData);
    const events = comp.getAllSubcomponents('vevent').map(event => {
      const summary = event.getFirstPropertyValue('summary');
      const start = event.getFirstPropertyValue('dtstart');
      const end = event.getFirstPropertyValue('dtend');
      const organizer = event.getFirstPropertyValue('organizer');
      return { summary, start, end, organizer };
    });

    return events;
  } catch (error) {
    console.error('Error al exportar el calendario:', error);
    throw new Error('No se pudo exportar el calendario.', error);
  }
}

exports.main = async (context = {}) => {
  // const { email, password } = context.parameters;

  try {
    const authToken = await getZimbraAuthToken();
    if (!authToken) {
      throw new Error('Error obteniendo el token de autenticación.');
    }

    const events = await exportZimbraCalendar(authToken);
    return events;
  } catch (error) {
    return `Error: ${error.message}`;
  }
};
