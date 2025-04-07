import React, { useState } from 'react';
import { getMetrics, setupInterceptor } from '../../services/ApiInterceptor';
import { calculateAverage, calculatePercentile } from '../../utils/metricsUtils';

const PerformanceMetrics: React.FC = () => {
  const [sessionName, setSessionName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [mapping, setMapping] = useState<{ [key: string]: string }>({});
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const handleStartSession = () => {
    if (!serviceName) {
      alert('Debes ingresar un nombre para el servicio.');
      return;
    }
    // Configuramos el interceptor con el nombre del servicio y el mapeo de endpoints.
    setupInterceptor(serviceName, mapping);
    setSessionStarted(true);
    // Aquí podrías inicializar o resetear las métricas para esta sesión.
  };

  const handleShowMetrics = () => {
    setShowMetrics(true);
  };

  const metricsData = getMetrics();

  // Ejemplo de cómo podrías procesar una métrica: calcular promedio y percentil para cada status.
  const renderMetrics = () => {
    if (!metricsData[serviceName]) return <p>No hay métricas capturadas para el servicio.</p>;
    return Object.entries(metricsData[serviceName]).map(([endpoint, statusObj]) => (
      <div key={endpoint}>
        <h4>Endpoint: {endpoint}</h4>
        {Object.entries(statusObj).map(([statusCode, data]) => {
          const avg = calculateAverage(data.responseTimes);
          const p90 = calculatePercentile(data.responseTimes, 90);
          return (
            <div key={statusCode}>
              <p>
                <strong>Status {statusCode}</strong>: {data.attempts} llamadas, tiempo promedio: {avg.toFixed(2)} ms, 90º percentil: {p90} ms
              </p>
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div>
      <h2>Sesión de Métricas de Performance</h2>
      <div>
        <label>Nombre de la Sesión: </label>
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
        />
      </div>
      <div>
        <label>Nombre del Servicio: </label>
        <input
          type="text"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
      </div>
      <div>
        <label>Mapeo de Endpoints (en formato JSON): </label>
        <textarea
          value={JSON.stringify(mapping, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setMapping(parsed);
            } catch (error) {
              // Aquí podrías mostrar un mensaje de error si el JSON es inválido
            }
          }}
          rows={5}
          cols={50}
        />
      </div>
      <button onClick={handleStartSession}>Iniciar Sesión</button>
      <button onClick={handleShowMetrics}>Mostrar Métricas</button>
      {showMetrics && (
        <div>
          <h3>Métricas Capturadas:</h3>
          {renderMetrics()}
          <pre>{JSON.stringify(metricsData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;
