import React from 'react';
import { SessionResults } from '../../types'; // Importamos tipos
import './ReportView.css';
// Importaríamos funciones de metricsCalculator.ts aquí

interface ReportViewProps {
  results: SessionResults; // Ahora es seguro que no es null
  goHome: () => void;
}

const ReportView: React.FC<ReportViewProps> = ({ results, goHome }) => {

  // Lógica para calcular métricas (promedio, p90, etc.) a partir de results
  // const calculatedMetrics = calculateMetrics(results); // Función de utils

  const handleExportJson = () => {
      const jsonData = JSON.stringify(results, null, 2); // Formateado
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${results.startTime}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="pdt-report-view pdt-view">
      <h2>Reporte de Rendimiento</h2>
      {/* Aquí mostraríamos las tablas/gráficas con las métricas calculadas */}
      <p>Inicio: {new Date(results.startTime).toLocaleString()}</p>
      <p>Fin: {results.endTime ? new Date(results.endTime).toLocaleString() : 'N/A'}</p>
      <p>Duración Total: {results.endTime ? ((results.endTime - results.startTime) / 1000).toFixed(2) : 'N/A'} seg</p>

      <div className="pdt-report-details">
          {/* Mapear results.services y results.endpoints para mostrar detalles */}
          <pre>{JSON.stringify(results, null, 2)}</pre> {/* Placeholder */}
      </div>


      <div className="pdt-report-actions">
        <button className="pdt-button" onClick={handleExportJson}>
            💾 Exportar Resultados (JSON)
        </button>
        <button className="pdt-button pdt-button-primary" onClick={goHome}>
            🏠 Volver al Inicio
        </button>
      </div>
    </div>
  );
};

export default ReportView;