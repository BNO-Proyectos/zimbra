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
  Icon,
  hubspot,
  Tile,
  StatusTag
} from '@hubspot/ui-extensions';

hubspot.extend(({ context, runServerlessFunction, actions }) => (
  <Extension
    context={context}
    runServerless={runServerlessFunction}
    sendAlert={actions.addAlert}
  />
));

const Extension = ({ context, runServerless, sendAlert }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [eventData, setEventData] = useState({
    summary: '',
    startDate: { year: '', month: '', date: '' }, 
    startHour: 0,
    startMinute: 0,
    endDate: { year: '', month: '', date: '' },
    endHour: 0,
    endMinute: 0,
    location: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const initialEventData = {
    summary: '',
    startDate: { year: '', month: '', date: '', hour: 0, minute: 0 },
    endDate: { year: '', month: '', date: '', hour: 0, minute: 0 },
    location: ''
  };
  //const [eventData, setEventData] = useState(initialEventData);

  // 2. Función para abrir modal y limpiar eventData
  const openModal = () => {
    setEventData(initialEventData); // Reinicia el formulario
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchEvents();
    }
  }, [selectedDate, isLoggedIn]);

  const fetchEvents = async () => {
    try {
      const resp = await runServerless({
        name: 'myFunc',
        parameters: { date: selectedDate }
      });

      if (Array.isArray(resp.response)) {
        const eventsForDate = resp.response
          .filter(event => new Date(event.start.year, event.start.month - 1, event.start.day).toDateString() === selectedDate.toDateString())
          .sort((a, b) => (a.start.hour * 60 + a.start.minute) - (b.start.hour * 60 + b.start.minute));

        setEvents(eventsForDate);
        //sendAlert({ message: 'Eventos cargados correctamente.' });
      } else {
        sendAlert({ message: 'Error: El formato de los eventos no es correcto.', type: 'danger' });
      }
    } catch (error) {
      sendAlert({ message: `Error al cargar eventos: ${error.message}`, type: 'danger' });
    }
  };

  const handleInputChange = (field, value) => setEventData(prevData => ({
    ...prevData,
    [field]: value
  }));

  const createEvent = async () => {
    try {
      await runServerless({
        name: 'create',
        parameters: eventData
      });
      sendAlert({ message: 'Cita creada exitosamente.', type: 'success' });
  
      const newEventDate = new Date(
        eventData.startDate.year,
        eventData.startDate.month, 
        eventData.startDate.date
      );
  
      setSelectedDate(newEventDate); 
  
      fetchEvents(); 
    } catch (error) {
      sendAlert({ title: 'Error', message: `Error al crear cita: ${error.message}`, type: 'danger' });
    }
  };
  

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days); 
    setSelectedDate(newDate);
  };

  const handleDateInputChange = (date) => {
    const formattedDate = new Date(date.year, date.month, date.date); 
    if (!isNaN(formattedDate)) { 
      setSelectedDate(formattedDate);
    }
  };


  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <Box width="100%" padding="medium">
        <Flex direction="column" justify="center" align="center" gap="medium">
          <Text fontSize="36px" fontWeight="bold">Inicia sesión con tu cuenta de Zimbra</Text>


          <Input
            label="Ingresa tu dirección de correo"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Ingresa tu contraseña"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={handleLogin}>Iniciar sesión</Button>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>
      <Box marginBottom="medium">
        <Flex direction="column" align="center" width="100%">
          <Flex justify="space-between" align="center" width="100%" maxWidth="500px">
            <Text format={{ fontSize: 'large' }} style={{ textAlign: 'left' }}>
              {selectedDate.toLocaleDateString('es-ES', { weekday: 'short' }).charAt(0).toUpperCase() + 
              selectedDate.toLocaleDateString('es-ES', { weekday: 'short' }).slice(1).toLowerCase()} 
              {`, ${selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </Text>
          </Flex>

          <Flex justify="space-between" align="center" width="100%" maxWidth="500px" marginTop="small">
            <Box>
              <DateInput
                value={{
                  year: selectedDate.getFullYear(),
                  month: selectedDate.getMonth(), // Ajustamos el mes para que sea de 1 a 12
                  date: selectedDate.getDate()
                }}
                onChange={handleDateInputChange}
                format="LL"
              />
            </Box>
            
            <Button onClick={() => handleDateChange()} style={{ fontSize: '1.5rem', color: '#0077b6' }}>
              <Icon name="left" />
            </Button>

            <Button onClick={() => handleDateChange(1)} style={{ fontSize: '1.5rem', color: '#0077b6' }}>
              <Icon name="right" />
            </Button>

            <Button
              overlay={
                <Modal id="default-modal" title="Crear nuevo evento" width="md">
                  <ModalBody>
                    <Form>
                      

                      <DateInput
                        label="Fecha y hora de inicio"
                        value={eventData.startDate}
                        onChange={(date) => handleInputChange('startDate', date)}
                      />

                    
                      <DateInput
                        label="Fecha y hora de finalización"
                        value={eventData.endDate}
                        onChange={(date) => handleInputChange('endDate', date)}
                      />


                      <Input
                        label="Descripción"
                        value={eventData.summary}
                        onChange={(e) => handleInputChange('summary', e)}
                      />
                      <Button onClick={createEvent}>Crear</Button>
                    </Form>
                  </ModalBody>
                </Modal>
              }
              style={{ marginLeft: 'auto' }}
            >
              Nueva Cita
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Box>
        {events.length > 0 ? (
          <Flex direction="column" gap="medium">
            {events.map((event, index) => (
              <Tile key={index} padding="medium">
                <Text format={{ fontWeight: 'bold', fontSize: 'medium' }}>{event.summary}</Text>
                <StatusTag color="blue" text="Programado" />
                <Flex justify="space-between">
                  <Text color="gray">Inicio:</Text>
                  <Text>{`${event.start.hour}:${event.start.minute} - ${event.start.year}/${event.start.month}/${event.start.day}`}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="gray">Fin:</Text>
                  <Text>{`${event.end.hour}:${event.end.minute} - ${event.end.year}/${event.end.month}/${event.end.day}`}</Text>
                </Flex>
                <Text>Ubicación: {event.location || 'No especificada'}</Text>
              </Tile>
            ))}
          </Flex>
        ) : (
          <Text>No se encontraron eventos para esta fecha</Text>
        )}
      </Box>
    </Box>
  );
};

export default Extension;
