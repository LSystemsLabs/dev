import React from 'react';
import { getMetrics } from '../../services/apiInterceptor';
import { EndpointDefinition, SessionData } from '../../types/performanceTypes';

interface CaptureModeProps {
  sessionData: SessionData;
  requestsCount: { [serviceName: string]: { [endpointKey: string]: number } };
  onTestEndpoint: (serviceName: string, endpoint: EndpointDefinition) => void;
  onEndSession: () => void;
}

const CaptureMode: React.FC<CaptureModeProps> = ({
  sessionData,
  requestsCount,
  onTestEndpoint,
  onEndSession,
}) => {
  const allMetrics = getMetrics();

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Modo de Captura</h3>
      <p>
        Dispara las peticiones de prueba para cada endpoint. Las llamadas serán registradas
        automáticamente por el interceptor.
      </p>
      {sessionData.services.map(service => (
        <div key={service.serviceName} style={{ marginBottom: '1rem' }}>
          <h4>{service.serviceName}</h4>
          {service.endpoints.map(ep => {
            const count = requestsCount[service.serviceName]?.[ep.key] || 0;
            const isComplete = count >= service.requestsPerEndpoint;
            let endpointStatus = 'Pendiente';
            if (isComplete) {
              endpointStatus = 'Completado ✓';
            }
            return (
              <div key={ep.key} style={{ marginBottom: '0.5rem' }}>
                <strong>{ep.key}</strong> ({ep.url}) - {endpointStatus}{' '}
                <button disabled={isComplete} onClick={() => onTestEndpoint(service.serviceName, ep)}>
                  Test Endpoint
                </button>
                <span style={{ marginLeft: '1rem' }}>
                  Llamadas: {count}/{service.requestsPerEndpoint}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <button onClick={onEndSession}>Terminar Sesión</button>
    </div>
  );
};

export default CaptureMode;
