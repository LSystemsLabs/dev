import React from 'react';
import { getMetrics } from '../../services/apiInterceptor';
import { SessionData } from '../../types/performanceTypes';
import { calculateAverage, calculatePercentile } from '../../utils/metricsUtils';

interface ReportViewProps {
  sessionData: SessionData;
  onExportJSON: () => void;
  onClose: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ sessionData, onExportJSON, onClose }) => {
  const allMetrics = getMetrics();

  const renderMetrics = () => {
    return Object.entries(allMetrics).map(([serviceName, endpointsObj]) => (
      <div key={serviceName} style={{ marginBottom: '1rem' }}>
        <h4>Servicio: {serviceName}</h4>
        {Object.entries(endpointsObj).map(([endpoint, statusMap]) => (
          <div key={endpoint} style={{ marginLeft: '1rem' }}>
            <h5>Endpoint: {endpoint}</h5>
            {Object.entries(statusMap).map(([statusCode, metric]) => {
              const avg = calculateAverage(metric.responseTimes);
              const p90 = calculatePercentile(metric.responseTimes, 90);
              return (
                <div key={statusCode} style={{ marginLeft: '1rem' }}>
                  <strong>Status {statusCode}</strong>:
                  <ul>
                    <li>Llamadas: {metric.attempts}</li>
                    <li>Promedio: {avg.toFixed(2)} ms</li>
                    <li>P90: {p90} ms</li>
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h3>Reporte Final</h3>
      <p>Aquí se muestran todas las métricas recopiladas por servicio y endpoint.</p>
      <div style={{ marginBottom: '1rem', maxHeight: '300px', overflow: 'auto' }}>
        {renderMetrics()}
      </div>
      <button onClick={onExportJSON}>Exportar a JSON</button>
      <button style={{ marginLeft: '1rem' }} onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
};

export default ReportView;
