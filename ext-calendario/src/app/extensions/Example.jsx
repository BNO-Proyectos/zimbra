import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  Form,
  DateInput,
  NumberInput,
  Input,
  Text,
  Box,
  Flex,
  hubspot,
} from '@hubspot/ui-extensions';

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

const Extension = ({ context, runServerless, sendAlert }) => {
  const [eventData, setEventData] = useState({
    summary: '',
    startDate: '',
    startHour: '',
    startMinute: '',
    endDate: '',
    endHour: '',
    endMinute: '',
    location: ''
  });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    runServerless({
      name: 'myFunc',
      parameters: {}
    })
      .then((resp) => {
        console.log(resp);

        if (Array.isArray(resp.response)) {
          setEvents(resp.response);
          sendAlert({ message: 'Eventos cargados correctamente.' });
        } else {
          sendAlert({ message: 'Error: El formato de los eventos no es correcto.', type: 'danger' });
        }
      })
      .catch((error) => {
        sendAlert({ message: `Error al cargar eventos: ${error.message}`, type: 'danger' });
      });
  }, []);

  const handleInputChange = (field, value) => {
    setEventData({
      ...eventData,
      [field]: value,
    });
  };

  async function createEvent() {
    console.log(eventData);
    try {
      await runServerless({
        name: 'create',
        parameters: eventData
      });
      sendAlert({ message: 'Evento creado exitosamente.', type: 'success' });
      // Recargar eventos
      runServerless({
        name: 'myFunc',
        parameters: {}
      })
        .then((resp) => {
          if (Array.isArray(resp.response)) {
            setEvents(resp.response); // Actualizar la lista de eventos
          } else {
            sendAlert({ message: 'Error: El formato de los eventos no es correcto.', type: 'danger' });
          }
        })
        .catch((error) => {
          sendAlert({ message: `Error al cargar eventos: ${error.message}`, type: 'danger' });
        });
    } catch (error) {
      sendAlert({ title: 'Error', message: `Error al crear evento: ${error.message}`, type: 'danger' });
    }
  }

  return (
    <Box>
      <Box>
        <Text format={{ fontWeight: 'bold' }}>Event List</Text>
        <Button
          overlay={
            <Modal id="default-modal" title="Crear nuevo evento" width="md">
              <ModalBody>
                <Form>
                  <Input
                    label="Descripción"
                    value={eventData.summary}
                    onChange={(e) => handleInputChange('summary', e)}
                  />

                  <DateInput
                    label="Fecha y hora de inicio"
                    value={eventData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                  />

                  <Flex align="center" gap="5px">
                    <NumberInput
                      // label="Start Hour"
                      min={0}
                      max={23}
                      value={eventData.startHour}
                      onChange={(hour) => handleInputChange('startHour', hour)}
                    />
                    <Text>:</Text>
                    <NumberInput
                      // label="Start Minute"
                      min={0}
                      max={59}
                      value={eventData.startMinute}
                      onChange={(minute) => handleInputChange('startMinute', minute)}
                    />
                  </Flex>

                  <DateInput
                    label="Fecha y hora de finalización"
                    value={eventData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                  />

                  <Flex align="center" gap="5px">
                    <NumberInput
                      // label="End Hour"
                      min={0}
                      max={23}
                      value={eventData.endHour}
                      onChange={(hour) => handleInputChange('endHour', hour)}
                    />
                    <Text>:</Text>
                    <NumberInput
                      // label="End Minute"
                      min={0}
                      max={59}
                      value={eventData.endMinute}
                      onChange={(minute) => handleInputChange('endMinute', minute)}
                    />
                  </Flex>

                  <Input
                    label="Ubicación"
                    value={eventData.location}
                    onChange={(e) => handleInputChange('location', e)}
                  />
                  <Button onClick={createEvent}>Crear</Button>
                </Form>
              </ModalBody>
            </Modal>
          }
        >
          Crear nuevo evento
        </Button>
      </Box>

      <Box>
        {events.length > 0 ? (
          <Flex direction="column" gap="medium">
            {events.map((event, index) => (
              <Box key={index} >
                <Text format={{ fontWeight: 'bold' }}>{event.summary}</Text>
                <Flex justify="space-between">
                  <Text>Inicio:</Text>
                  <Text>{event.start.year}/{event.start.month}/{event.start.day} {event.start.hour}:{event.start.minute}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Fin:</Text>
                  <Text>{event.end.year}/{event.end.month}/{event.end.day} {event.end.hour}:{event.end.minute}</Text>
                </Flex>
              </Box>
            ))}
          </Flex>
        ) : (
          <Text>No se encontraron eventos</Text>
        )}
      </Box>

    </Box>
  );
};

export default Extension;
