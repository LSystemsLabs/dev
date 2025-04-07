import React, { useState } from 'react';
import { getMetrics, setupInterceptor } from '../../services/apiInterceptor';
import { DevToolStep, SessionData } from '../../types/performanceTypes';
import CaptureMode from './CaptureMode';
import HomeScreen from './HomeScreen';
import ReportView from './ReportView';
import SessionSetup from './SessionSetup';

// Estado para contar las peticiones por endpoint durante el modo captura
interface RequestsCount {
  [serviceName: string]: { [endpointKey: string]: number };
}

const PerformanceDevTool: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<DevToolStep>(DevToolStep.HOME);
  const [sessionData, setSessionData] = useState<SessionData>({
    sessionName: '',
    services: [],
  });
  const [requestsCount, setRequestsCount] = useState<RequestsCount>({});

  // Maneja la carga de sesión desde un archivo JSON
  const handleLoadSession = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target?.result as string);
        setSessionData(loadedData);
        setCurrentStep(DevToolStep.REPORT);
      } catch (error) {
        console.error('Error al cargar JSON:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleStartNewSession = () => {
    setSessionData({ sessionName: '', services: [] });
    setCurrentStep(DevToolStep.SESSION_SETUP);
  };

  const handleUpdateSession = (data: SessionData) => {
    setSessionData(data);
  };

  // Al pasar al modo captura, configuramos los interceptores para cada servicio.
  const handleGoToCapture = () => {
    sessionData.services.forEach(service => {
      const mapping: { [key: string]: string } = {};
      service.endpoints.forEach(ep => {
        mapping[ep.url] = ep.key;
      });
      setupInterceptor(service.serviceName, mapping);
    });
    setCurrentStep(DevToolStep.CAPTURE);
  };

  const handleTestEndpoint = (serviceName: string, endpoint: { key: string; url: string }) => {
    import('axios').then(({ default: axios }) => {
      axios.get(endpoint.url)
        .then(() => {
          console.log('Respuesta exitosa');
        })
        .catch(err => {
          console.error('Error en la llamada:', err);
        })
        .finally(() => {
          setRequestsCount(prev => {
            const prevService = prev[serviceName] || {};
            const currentCount = prevService[endpoint.key] || 0;
            return {
              ...prev,
              [serviceName]: {
                ...prevService,
                [endpoint.key]: currentCount + 1,
              },
            };
          });
        });
    });
  };

  const handleEndSession = () => {
    setCurrentStep(DevToolStep.REPORT);
  };

  const handleExportJSON = () => {
    const exportObject = {
      sessionData,
      metrics: getMetrics(),
    };
    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sessionData.sessionName || 'session'}-metrics.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Renderiza la vista según el paso actual
  const renderContent = () => {
    switch (currentStep) {
      case DevToolStep.HOME:
        return (
          <HomeScreen
            onStartNewSession={handleStartNewSession}
            onLoadSession={handleLoadSession}
          />
        );
      case DevToolStep.SESSION_SETUP:
        return (
          <SessionSetup
            sessionData={sessionData}
            onUpdateSession={handleUpdateSession}
            onGoToCapture={handleGoToCapture}
          />
        );
      case DevToolStep.CAPTURE:
        return (
          <CaptureMode
            sessionData={sessionData}
            requestsCount={requestsCount}
            onTestEndpoint={handleTestEndpoint}
            onEndSession={handleEndSession}
          />
        );
      case DevToolStep.REPORT:
        return (
          <ReportView
            sessionData={sessionData}
            onExportJSON={handleExportJSON}
            onClose={() => {
              // Reinicia el flujo o cierra el DevTool según tu lógica.
              setCurrentStep(DevToolStep.HOME);
            }}
          />
        );
      default:
        return null;
    }
  };

  // Estilos del panel DevTool y botón de toggle
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: isOpen ? 350 : 0,
    height: '100vh',
    backgroundColor: '#282c34',
    color: '#fff',
    overflowX: 'hidden',
    transition: '0.3s',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
  };

  const toggleButtonStyle: React.CSSProperties = {
    position: 'fixed',
    top: 10,
    left: isOpen ? 350 : 0,
    backgroundColor: '#61dafb',
    color: '#000',
    border: 'none',
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'left 0.3s',
    zIndex: 10000,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
  };

  return (
    <>
      <button style={toggleButtonStyle} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Cerrar DevTool' : 'Abrir DevTool'}
      </button>
      <div style={panelStyle}>
        {isOpen && (
          <div style={contentStyle}>
            <h2 style={{ textAlign: 'center', margin: '1rem 0' }}>Performance DevTool</h2>
            {renderContent()}
          </div>
        )}
      </div>
    </>
  );
};

export default PerformanceDevTool;
