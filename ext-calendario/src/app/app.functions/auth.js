const axios = require('axios');

async function getZimbraAuthToken() {
    console.log('Obteniendo token de autenticación...');
    
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
            console.log(authTokenMatch[1]);
            
            return authTokenMatch[1];
        } else {
            throw new Error('No se pudo obtener el token de autenticación.');
        }
    } catch (error) {
        console.error('Error al obtener el token de autenticación:', error);
        return null;
    }
}

// Para que HubSpot acepte el archivo
exports.main = async () => {
    try {
        const authToken = await getZimbraAuthToken();
        if (!authToken) {
            throw new Error('Error obteniendo el token de autenticación.');
        }
        return { token: authToken };
    } catch (error) {
        return { error: error.message };
    }
};

module.exports = { getZimbraAuthToken };
