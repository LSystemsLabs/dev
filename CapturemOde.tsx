// src/components/PerformanceDevTool/components/CaptureMode/CaptureMode.tsx
import React, { useCallback, useEffect, useState } from 'react';
// Quitamos import de Axios ya que no lo usaremos directamente aquí
// import axios, { AxiosError } from 'axios';
import { CallMetric, EndpointStatus, SessionConfig, SessionResults } from '../../types';
import { removeAxiosInterceptor, setupAxiosInterceptor } from '../../utils/axiosInterceptor';
import './CaptureMode.css';

interface CaptureModeProps {
  sessionConfig: SessionConfig;
  setResults: (results: SessionResults) => void;
  goToReport: () => void;
}

const CaptureMode: React.FC<CaptureModeProps> = ({ sessionConfig, setResults, goToReport }) => {
  const [captureData, setCaptureData] = useState<SessionResults | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(true); // Indica si estamos en modo captura activo

  // --- Callback para el Interceptor (Lógica Principal Ahora) ---
  const handleInterceptedCall = useCallback((metric: CallMetric, interceptedUrl: string) => {
    setCaptureData(prevData => {
      // Si no hay datos previos o la captura ha terminado, no hacer nada
      if (!prevData || !isCapturing) return prevData;

      let matchFound = false;
      let dataWasUpdated = false; // Bandera para saber si realmente cambiamos el estado

      const updatedServices = prevData.services.map(service => {
        if (matchFound) return service; // Optimización: No seguir buscando si ya encontramos

        let serviceNeedsUpdate = false;
        const updatedEndpoints = service.endpoints.map(endpoint => {
          // Optimización y lógica de estado final
          if (matchFound || serviceNeedsUpdate || endpoint.status === 'completed' || endpoint.status === 'error') {
            // No procesar si:
            // 1. Ya encontramos un match en otro endpoint/servicio.
            // 2. Ya actualizamos un endpoint en este servicio.
            // 3. El endpoint ya está en estado final ('completed' o 'error').
            return endpoint;
          }

          // Lógica de Matching: URL interceptada incluye el fragmento configurado?
          if (interceptedUrl.includes(endpoint.config.urlFragment)) {
            console.log(`[CaptureMode] Match found! Intercepted: ${interceptedUrl}, Matched Fragment: ${endpoint.config.urlFragment} (Key: ${endpoint.config.key})`);
            matchFound = true; // Marcar match global
            serviceNeedsUpdate = true; // Marcar necesidad de actualizar este servicio
            dataWasUpdated = true; // Marcar que hubo un cambio en el estado general

            // Añadir la métrica y calcular nuevo contador
            const newCalls = [...endpoint.calls, metric];
            const newCallCount = newCalls.length;
            const targetCalls = endpoint.config.requests; // El 'Y' en [X/Y]

            // Determinar nuevo estado basado en la métrica y el contador
            let newStatus: EndpointStatus;
            if (metric.error || metric.status >= 400) {
              newStatus = 'error'; // Error inmediato
              console.log(`[CaptureMode] Endpoint ${endpoint.config.key} set to ERROR due to status ${metric.status} or error: ${metric.error}`);
            } else if (newCallCount >= targetCalls) {
              newStatus = 'completed'; // Alcanzó el número de llamadas objetivo
              console.log(`[CaptureMode] Endpoint ${endpoint.config.key} set to COMPLETED (${newCallCount}/${targetCalls})`);
            } else {
              newStatus = 'running'; // Aún no alcanza el objetivo, sigue corriendo/escuchando
            }

            // Retornar el endpoint actualizado
            return {
              ...endpoint,
              status: newStatus,
              calls: newCalls,
            };
          }
          // Si no hay match para este endpoint, retornarlo sin cambios
          return endpoint;
        }); // Fin map endpoints

        // Si los endpoints de este servicio cambiaron, retornar el servicio actualizado
        if (serviceNeedsUpdate) {
          return { ...service, endpoints: updatedEndpoints };
        }
        return service; // Sin cambios en este servicio
      }); // Fin map services

      // Solo retornar nuevo estado si hubo alguna actualización real
      if (dataWasUpdated) {
        return { ...prevData, services: updatedServices };
      }

      // Si no hubo match o cambios, retornar el estado previo exactamente igual
      return prevData;
    }); // Fin setCaptureData
  }, [isCapturing]); // Depende de isCapturing para detener actualizaciones si se finaliza la sesión

  // --- Efecto para Configurar y Limpiar Interceptor ---
  useEffect(() => {
    // Inicializar estructura de resultados (sin cambios)
    const initialResults: SessionResults = {
      config: sessionConfig,
      startTime: Date.now(),
      services: sessionConfig.services.map(serviceConfig => ({
        config: serviceConfig,
        endpoints: serviceConfig.endpoints.map(endpointConfig => ({
          config: endpointConfig,
          status: 'pending',
          calls: [],
        })),
      })),
    };
    setCaptureData(initialResults);
    setIsCapturing(true);

    // Configurar el interceptor
    console.log("[CaptureMode] Setting up Axios Interceptor");
    setupAxiosInterceptor(handleInterceptedCall);

    // Limpiar el interceptor
    return () => {
      console.log("[CaptureMode] Removing Axios Interceptor");
      removeAxiosInterceptor();
      setIsCapturing(false);
    };
  }, [sessionConfig, handleInterceptedCall]); // Dependencias correctas

  // --- Ejecución Manual ELIMINADA ---
  // const handleRunTest = async (...) => { ... } // Eliminada

  // --- Finalizar Sesión ---
  const handleEndSession = () => {
    if (!captureData) return;
    setIsCapturing(false); // Detener futuras actualizaciones por interceptor *antes* de guardar
    const finalResults: SessionResults = {
      ...captureData,
      endTime: Date.now(),
    };
    // ¡Importante! Pasar una copia fresca de los datos finales.
    // setCaptureData(finalResults); // Opcional actualizar estado local, pero ya no se usará
    setResults(finalResults); // Pasar los resultados finales al padre
    // La limpieza del interceptor ocurre en el cleanup de useEffect
    goToReport();
  };

  // --- Comprobar si todo está finalizado (sin cambios) ---
  const allDone = captureData?.services.every(s =>
    s.endpoints.every(e => e.status === 'completed' || e.status === 'error')
  ) ?? false;

  // --- Renderizado ---
  if (!captureData) {
    return <div className="pdt-view pdt-loading">Inicializando modo captura...</div>;
  }

  return (
    <div className="pdt-capture-mode pdt-view">
      <h2>Modo Captura Automática</h2>
      {isCapturing ? (
        <p>Escuchando llamadas API de la aplicación. Realiza acciones en tu app para registrar métricas.</p>
      ) : (
        <p>Captura finalizada. Puedes ver el reporte.</p>
      )}

      <div className="pdt-capture-list">
        {captureData.services.map(service => (
          <div key={service.config.id} className="pdt-capture-service">
            <h3>{service.config.name}</h3>
            <ul>
              {service.endpoints.map(endpoint => (
                <li key={endpoint.config.id} className={`pdt-endpoint-item status-${endpoint.status}`}>
                  {/* Key */}
                  <span className="pdt-endpoint-key" title={endpoint.config.key}>{endpoint.config.key}</span>

                  {/* Fragmento URL */}
                  <span className="pdt-endpoint-url" title={`Fragmento buscado: ${endpoint.config.urlFragment}`}>
                    Frag: {endpoint.config.urlFragment}
                  </span>

                  {/* Estado y Contador [X/Y] */}
                  <span
                    className="pdt-endpoint-status"
                    title={`${endpoint.calls.length} llamadas interceptadas de ${endpoint.config.requests} objetivo`}
                  >
                    {endpoint.status} [{endpoint.calls.length}/{endpoint.config.requests}]
                  </span>

                  {/* Indicador Visual (ya no hay botón de ejecutar) */}
                  <span className={`pdt-endpoint-done-indicator status-${endpoint.status}`}>
                    {endpoint.status === 'pending' ? '⚪' : // Pendiente
                     endpoint.status === 'running' ? '👁️' : // Corriendo/Escuchando
                     endpoint.status === 'completed' ? '✅' : // Completado
                     endpoint.status === 'error' ? '❌' : // Error
                     ''}
                  </span>
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
          disabled={!isCapturing} // Deshabilitar solo si ya se finalizó
          title={allDone ? "Todos los objetivos alcanzados. Ver reporte." : "Finalizar sesión y ver reporte (puede haber objetivos pendientes)"}
        >
          {allDone ? 'Ver Reporte ➔' : 'Finalizar y Ver Reporte ➔'}
        </button>
      </div>
    </div>
  );
};

export default CaptureMode;