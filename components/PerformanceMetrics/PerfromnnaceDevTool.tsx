import React, { useState } from 'react';
import './PerformanceDevTool.css';
import CaptureMode from './components/CaptureMode/CaptureMode';
import HomeScreen from './components/HomeScreen/HomeScreen';
import ReportView from './components/ReportView/ReportView';
import SessionSetup from './components/SessionSetup/SessionSetup';
import { SessionConfig, SessionResults, ViewType } from './types';

const PerformanceDevTool: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('HOME');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionResults, setSessionResults] = useState<SessionResults | null>(null);

  const handleGoToSetup = () => setCurrentView('SETUP');
  const handleGoToCapture = () => setCurrentView('CAPTURE');
  const handleGoToReport = () => setCurrentView('REPORT');
  const handleGoHome = () => {
      setSessionConfig(null); // Reiniciar config al volver a home
      setSessionResults(null); // Reiniciar resultados
      setCurrentView('HOME');
  };

  // Función para actualizar la configuración (pasada a SessionSetup)
  const handleUpdateConfig = (config: SessionConfig) => {
      setSessionConfig(config);
  };

   // Función para actualizar los resultados (pasada a CaptureMode)
   const handleUpdateResults = (results: SessionResults) => {
      setSessionResults(results);
  };


  const renderCurrentView = () => {
    switch (currentView) {
      case 'SETUP':
        return (
          <SessionSetup
            currentConfig={sessionConfig} // Pasamos config actual por si se edita
            setSessionConfig={handleUpdateConfig}
            goToCapture={handleGoToCapture}
          />
        );
      case 'CAPTURE':
        // Aseguramos que sessionConfig no sea null antes de ir a Capture
        if (!sessionConfig) {
            console.error("Error: Intentando entrar a Capture sin configuración.");
            setCurrentView('SETUP'); // Volver a setup si no hay config
            return null;
        }
        return (
          <CaptureMode
            sessionConfig={sessionConfig}
            setResults={handleUpdateResults}
            goToReport={handleGoToReport}
          />
        );
      case 'REPORT':
         // Aseguramos que sessionResults no sea null antes de ir a Report
        if (!sessionResults) {
            console.error("Error: Intentando entrar a Report sin resultados.");
            setCurrentView('CAPTURE'); // Volver a captura si no hay resultados
            return null;
        }
        return (
            <ReportView results={sessionResults} goHome={handleGoHome} />
        );
      case 'HOME':
      default:
        return <HomeScreen goToSetup={handleGoToSetup} />;
        // Aquí añadiríamos la lógica para cargar sesión existente (loadSession)
    }
  };

  // Renderizar solo en modo desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="pdt-container">
      {/* Podríamos añadir un Header/Nav común aquí */}
      <div className="pdt-content">
        {renderCurrentView()}
      </div>
      <button className="pdt-home-button" onClick={handleGoHome} title="Volver al inicio / Resetear">🏠</button>
    </div>
  );
};

export default PerformanceDevTool;