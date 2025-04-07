import React, { useState } from 'react';
import { ServiceDefinition, SessionData } from '../../types/performanceTypes';

interface SessionSetupProps {
  sessionData: SessionData;
  onUpdateSession: (data: SessionData) => void;
  onGoToCapture: () => void;
}

const SessionSetup: React.FC<SessionSetupProps> = ({ sessionData, onUpdateSession, onGoToCapture }) => {
  const [tempServiceName, setTempServiceName] = useState('');
  const [tempServiceRequests, setTempServiceRequests] = useState(3);
  const [endpointsText, setEndpointsText] = useState('');
  const [currentServiceForEndpoints, setCurrentServiceForEndpoints] = useState<string | null>(null);
  const [showAddEndpointsModal, setShowAddEndpointsModal] = useState(false);

  const handleAddService = () => {
    if (!tempServiceName.trim()) {
      alert('Ingresa un nombre para el servicio');
      return;
    }
    const newService: ServiceDefinition = {
      serviceName: tempServiceName,
      endpoints: [],
      requestsPerEndpoint: tempServiceRequests,
    };
    onUpdateSession({
      ...sessionData,
      services: [...sessionData.services, newService],
    });
    setTempServiceName('');
    setTempServiceRequests(3);
  };

  const handleOpenAddEndpointsModal = (serviceName: string) => {
    setCurrentServiceForEndpoints(serviceName);
    setEndpointsText('');
    setShowAddEndpointsModal(true);
  };

  const handleAddEndpoints = () => {
    if (!endpointsText.trim() || !currentServiceForEndpoints) {
      setShowAddEndpointsModal(false);
      return;
    }
    const pairs = endpointsText.split(',').map(item => item.trim());
    const newEndpoints = pairs.map(pair => {
      const [key, url] = pair.split(':').map(p => p.trim());
      return { key, url };
    });

    const updatedServices = sessionData.services.map(service => {
      if (service.serviceName === currentServiceForEndpoints) {
        return {
          ...service,
          endpoints: [...service.endpoints, ...newEndpoints],
        };
      }
      return service;
    });

    onUpdateSession({ ...sessionData, services: updatedServices });
    setShowAddEndpointsModal(false);
    setCurrentServiceForEndpoints(null);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Configurar Sesión</h3>
      <div style={{ marginBottom: '1rem' }}>
        <label>Nombre de la Sesión: </label>
        <input
          type="text"
          value={sessionData.sessionName}
          onChange={e => onUpdateSession({ ...sessionData, sessionName: e.target.value })}
        />
      </div>
      <h4>Servicios:</h4>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <input
          placeholder="Nombre del servicio"
          value={tempServiceName}
          onChange={e => setTempServiceName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          placeholder="Requests/endpoint"
          value={tempServiceRequests}
          onChange={e => setTempServiceRequests(Number(e.target.value))}
        />
        <button onClick={handleAddService}>Agregar Servicio</button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        {sessionData.services.map(service => (
          <div key={service.serviceName} style={{ marginBottom: '0.5rem' }}>
            <strong>{service.serviceName}</strong> (Requests/endpoint: {service.requestsPerEndpoint})
            <button style={{ marginLeft: '1rem' }} onClick={() => handleOpenAddEndpointsModal(service.serviceName)}>
              Añadir Endpoints
            </button>
            <ul>
              {service.endpoints.map(ep => (
                <li key={ep.key}>
                  {ep.key} : {ep.url}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <button style={{ marginTop: '1rem' }} onClick={onGoToCapture}>
        Iniciar Modo de Captura
      </button>

      {showAddEndpointsModal && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <h4>Añadir Endpoints a {currentServiceForEndpoints}</h4>
            <p>Formato: key1:url1, key2:url2, ...</p>
            <textarea
              rows={5}
              cols={30}
              value={endpointsText}
              onChange={e => setEndpointsText(e.target.value)}
            />
            <div style={{ marginTop: '1rem' }}>
              <button onClick={handleAddEndpoints}>Guardar</button>
              <button onClick={() => setShowAddEndpointsModal(false)} style={{ marginLeft: '1rem' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#000',
  padding: '1rem',
  borderRadius: '4px',
  width: '300px',
};

export default SessionSetup;
