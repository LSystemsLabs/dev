// src/components/PerformanceDevTool/components/CaptureMode/CaptureMode.tsx
import axios, { AxiosError } from 'axios'; // Importar Axios y AxiosError
import React, { useEffect, useState } from 'react';
import { CallMetric, EndpointStatus, SessionConfig, SessionResults } from '../../types';
import './CaptureMode.css';

interface CaptureModeProps {
  sessionConfig: SessionConfig;
  setResults: (results: SessionResults) => void;
  goToReport: () => void;
}

const CaptureMode: React.FC<CaptureModeProps> = ({ sessionConfig, setResults, goToReport }) => {
  const [captureData, setCaptureData] = useState<SessionResults | null>(null);
  // Mantenemos isCapturing por si queremos añadir lógica de interceptor automático o pausar/reanudar
  const [isCapturing, setIsCapturing] = useState<boolean>(true); // Asumimos que inicia activo para pruebas manuales

  useEffect(() => {
    // Inicializar estructura de resultados basada en la configuración
    const initialResults: SessionResults = {
      config: sessionConfig,
      startTime: Date.now(),
      services: sessionConfig.services.map(serviceConfig => ({
        config: serviceConfig,
        endpoints: serviceConfig.endpoints.map(endpointConfig => ({
          config: endpointConfig,
          status: 'pending', // Todos empiezan pendientes
          calls: [],
        })),
      })),
    };
    setCaptureData(initialResults);

    // NOTA: Aquí NO configuraremos el interceptor automático todavía.
    // Nos centramos en la ejecución manual con el botón.

  }, [sessionConfig]); // Se reinicia si la configuración cambia

  // --- Helpers para actualizar estado (inmutables) ---
  const updateEndpointStatus = (serviceId: string, endpointId: string, status: EndpointStatus) => {
    setCaptureData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        services: prevData.services.map(s =>
          s.config.id === serviceId
            ? {
                ...s,
                endpoints: s.endpoints.map(e =>
                  e.config.id === endpointId ? { ...e, status } : e
                ),
              }
            : s
        ),
      };
    });
  };

  const addCallMetric = (serviceId: string, endpointId: string, metric: CallMetric) => {
    setCaptureData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        services: prevData.services.map(s =>
          s.config.id === serviceId
            ? {
                ...s,
                endpoints: s.endpoints.map(e =>
                  e.config.id === endpointId
                    ? { ...e, calls: [...e.calls, metric] }
                    : e
                ),
              }
            : s
        ),
      };
    });
  }

  // --- Ejecución Manual de Pruebas ---
  const handleRunTest = async (serviceId: string, endpointId: string) => {
    if (!captureData) return;

    // Encontrar el servicio y endpoint en el estado actual
    const serviceIndex = captureData.services.findIndex(s => s.config.id === serviceId);
    if (serviceIndex === -1) return;
    const endpointIndex = captureData.services[serviceIndex].endpoints.findIndex(e => e.config.id === endpointId);
    if (endpointIndex === -1) return;

    const currentEndpointState = captureData.services[serviceIndex].endpoints[endpointIndex];
    const endpointConfig = currentEndpointState.config;

    // Evitar ejecuciones múltiples si ya está corriendo o completado/error
    if (currentEndpointState.status !== 'pending') {
        console.warn(`Endpoint ${endpointConfig.key} no está en estado 'pending'. Estado actual: ${currentEndpointState.status}`);
        return;
    }

    // Actualizar estado a 'running' antes de empezar las llamadas
    updateEndpointStatus(serviceId, endpointId, 'running');
    console.log(`Ejecutando ${endpointConfig.requests} peticiones para [${endpointConfig.key}] (${endpointConfig.url})...`);

    let endpointFailed = false; // Bandera para saber si ocurrió un error

    for (let i = 0; i < endpointConfig.requests; i++) {
      const startTime = performance.now();
      try {
        // *** Ejecutar la petición real con Axios ***
        // Asumimos GET por ahora. Para otros métodos, necesitaríamos más config.
        const response = await axios.get(endpointConfig.url, {
            // Podríamos añadir un timeout si quisiéramos
            // timeout: 10000, // 10 segundos
             // Evitar que Axios lance error por códigos 4xx/5xx para poder registrarlos nosotros
            validateStatus: function (status) {
                 return status >= 100 && status < 600; // Aceptar cualquier status code
            }
        });
        const endTime = performance.now();
        const duration = endTime - startTime;

        const successMetric: CallMetric = {
          timestamp: Date.now(),
          duration: parseFloat(duration.toFixed(2)),
          status: response.status,
          // No hay error en este caso
        };
        addCallMetric(serviceId, endpointId, successMetric);

         // Si el status es >= 400, lo consideramos un "fallo" aunque técnicamente la llamada se completó
        if (response.status >= 400) {
            console.warn(`Petición ${i + 1} para [${endpointConfig.key}] completada con status ${response.status}`);
            // Opcional: Podríamos decidir marcarlo como error y parar aquí también
            // endpointFailed = true;
            // break;
        }


      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime; // Tiempo hasta que ocurrió el error

        let status = 0;
        let message = 'Unknown Error';

        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            status = axiosError.response?.status || 0; // 0 si no hubo respuesta (ej. Network Error)
            message = axiosError.message;
             console.error(`Error en petición ${i + 1} para [${endpointConfig.key}]: AxiosError - Status ${status}, Msg: ${message}`);
        } else if (error instanceof Error) {
            message = error.message;
             console.error(`Error en petición ${i + 1} para [${endpointConfig.key}]: Generic Error - Msg: ${message}`);
        } else {
             console.error(`Error desconocido en petición ${i + 1} para [${endpointConfig.key}]:`, error);
        }


        const errorMetric: CallMetric = {
          timestamp: Date.now(),
          duration: parseFloat(duration.toFixed(2)),
          status: status,
          error: message,
        };
        addCallMetric(serviceId, endpointId, errorMetric);

        endpointFailed = true; // Marcamos que falló
        break; // Detener las peticiones restantes para este endpoint si una falla
      }
    } // Fin del bucle for

    // Actualizar estado final del endpoint
    if (endpointFailed) {
        updateEndpointStatus(serviceId, endpointId, 'error');
    } else {
        updateEndpointStatus(serviceId, endpointId, 'completed');
    }
     console.log(`Pruebas para [${endpointConfig.key}] finalizadas. Estado: ${endpointFailed ? 'error' : 'completed'}`);
  };

  // --- Finalizar Sesión ---
  const handleEndSession = () => {
    if (!captureData) return;
    // Asegurarse de que todos los endpoints hayan sido al menos intentados (no 'pending')
    // Opcional: podrías querer forzar la finalización aquí incluso si algo quedó pendiente
    const finalResults: SessionResults = {
      ...captureData,
      endTime: Date.now(),
    };
    setCaptureData(finalResults);
    setResults(finalResults); // Pasar resultados al padre
    setIsCapturing(false); // Marcar como no capturando
    goToReport(); // Ir al reporte
  };

  // Comprobar si todos los endpoints están en un estado final (completed o error)
  const allDone = captureData?.services.every(s =>
    s.endpoints.every(e => e.status === 'completed' || e.status === 'error')
  ) ?? false;

  // --- Renderizado ---
  if (!captureData) {
    return <div className="pdt-view pdt-loading">Inicializando modo captura...</div>;
  }

  return (
    <div className="pdt-capture-mode pdt-view">
      <h2>Modo Captura / Ejecución Manual</h2>
      {isCapturing ? (
        <p>Ejecuta las pruebas para cada endpoint usando el botón ▶️.</p>
      ) : (
        <p>Captura finalizada.</p>
      )}

      <div className="pdt-capture-list">
        {captureData.services.map(service => (
          <div key={service.config.id} className="pdt-capture-service">
            <h3>{service.config.name}</h3>
            <ul>
              {service.endpoints.map(endpoint => (
                <li key={endpoint.config.id} className={`pdt-endpoint-item status-${endpoint.status}`}>
                  <span className="pdt-endpoint-key" title={endpoint.config.key}>{endpoint.config.key}</span>
                  <span className="pdt-endpoint-url" title={endpoint.config.url}>{endpoint.config.url}</span>
                  <span className="pdt-endpoint-status">{endpoint.status} [{endpoint.calls.length}/{endpoint.config.requests}]</span>
                  {/* Mostrar botón de ejecución solo si está pendiente y la sesión está activa */}
                  {endpoint.status === 'pending' && isCapturing && (
                    <button
                      onClick={() => handleRunTest(service.config.id, endpoint.config.id)}
                      className="pdt-button pdt-button-small pdt-button-run"
                      title={`Ejecutar ${endpoint.config.requests} veces`}
                    >
                      ▶️ Ejecutar
                    </button>
                  )}
                   {/* Podríamos mostrar un icono o mensaje si ya se ejecutó */}
                   {(endpoint.status === 'completed' || endpoint.status === 'error') && (
                       <span className={`pdt-endpoint-done-indicator status-${endpoint.status}`}>
                           {endpoint.status === 'completed' ? '✅' : '❌'}
                       </span>
                   )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pdt-capture-actions">
        <button
          className="pdt-button pdt-button-secondary"
          onClick={handleEndSession}
          // Habilitar si todo está hecho O si el usuario decide finalizar antes (isCapturing)
          // O simplemente habilitar siempre que esté capturando? Decidimos habilitar si todo está hecho o si se quiere parar.
          disabled={!isCapturing}
          title={allDone ? "Ver reporte" : "Finalizar sesión (puede haber endpoints pendientes)"}
        >
          {allDone ? 'Ver Reporte ➔' : 'Finalizar y Ver Reporte ➔'}
        </button>
      </div>
    </div>
  );
};

export default CaptureMode;