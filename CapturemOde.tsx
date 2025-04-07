import React, { useEffect, useState } from 'react';
import { CallMetric, EndpointStatus, SessionConfig, SessionResults } from '../../types'; // Importamos tipos
import './CaptureMode.css';

interface CaptureModeProps {
  sessionConfig: SessionConfig; // Ahora es seguro que no es null
  setResults: (results: SessionResults) => void;
  goToReport: () => void;
}

const CaptureMode: React.FC<CaptureModeProps> = ({ sessionConfig, setResults, goToReport }) => {

  // Estado para almacenar los resultados en progreso
  const [captureData, setCaptureData] = useState<SessionResults | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false); // Para controlar estado general

  // Inicializar el estado de los resultados cuando el componente monta
  useEffect(() => {
    const initialResults: SessionResults = {
        config: sessionConfig,
        startTime: Date.now(),
        services: sessionConfig.services.map(serviceConfig => ({
            config: serviceConfig,
            endpoints: serviceConfig.endpoints.map(endpointConfig => ({
                config: endpointConfig,
                status: 'pending',
                calls: []
            }))
        }))
    };
    setCaptureData(initialResults);
    setIsCapturing(true); // O podría iniciarse manualmente con un botón "Empezar"

    // Aquí es donde configuraríamos el interceptor de Axios
    // setupAxiosInterceptor(handleNewCall);

    // Limpiar interceptor al desmontar
    // return () => {
    //   removeAxiosInterceptor();
    // };

  }, [sessionConfig]); // Depende de la configuración de sesión

   // Función que el interceptor llamaría con datos de una llamada API
   const handleNewCall = (/* datos de la llamada: url, status, duration, error */) => {
       if (!captureData) return;

       // Lógica para encontrar el endpoint correspondiente (por URL o Key)
       // y actualizar su estado y métricas en captureData
       // setCaptureData(updatedData);
       console.log("Interceptando llamada..."); // Placeholder
   };

   // Función para ejecutar manualmente una prueba para un endpoint específico
   const handleRunTest = async (serviceId: string, endpointId: string) => {
       if (!captureData) return;

       // Encontrar el endpoint
       const serviceIndex = captureData.services.findIndex(s => s.config.id === serviceId);
       if (serviceIndex === -1) return;
       const endpointIndex = captureData.services[serviceIndex].endpoints.findIndex(e => e.config.id === endpointId);
       if (endpointIndex === -1) return;

       const endpointResult = captureData.services[serviceIndex].endpoints[endpointIndex];
       const endpointConfig = endpointResult.config;

        // Actualizar estado a 'running'
        updateEndpointStatus(serviceId, endpointId, 'running');

        console.log(`Ejecutando ${endpointConfig.requests} peticiones para ${endpointConfig.key}...`);

        // Simular llamadas (reemplazar con llamadas Axios reales)
        for (let i = 0; i < endpointConfig.requests; i++) {
            try {
                // const startTime = performance.now();
                // await axios.get(endpointConfig.url); // O el método necesario
                // const endTime = performance.now();
                // const duration = endTime - startTime;
                // const status = 200; // Obtener de la respuesta real
                // const newCall: CallMetric = { timestamp: Date.now(), duration, status };
                // addCallMetric(serviceId, endpointId, newCall);

                // Placeholder Simulado
                await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 50)); // Simula delay
                const duration = Math.random() * 500 + 50;
                const status = Math.random() > 0.1 ? 200 : 500; // Simula éxito/error
                const newCall: CallMetric = { timestamp: Date.now(), duration, status };
                 addCallMetric(serviceId, endpointId, newCall);
                 if (status >= 400) throw new Error(`Simulated Error ${status}`); // Simular error si status >= 400

            } catch (error: any) {
                 const errorMetric: CallMetric = {
                     timestamp: Date.now(),
                     duration: 0, // O medir tiempo hasta el error
                     status: error.response?.status || 500, // Obtener status del error si es posible
                     error: error.message || 'Unknown Error'
                 };
                 addCallMetric(serviceId, endpointId, errorMetric);
                 updateEndpointStatus(serviceId, endpointId, 'error');
                 console.error(`Error en petición ${i + 1} para ${endpointConfig.key}:`, error.message);
                 // Podríamos decidir parar las demás peticiones para este endpoint si falla una
                 break; // Salir del bucle si hay error
            }
        }
        // Marcar como completado si no hubo error que cambiara el estado
        if(captureData.services[serviceIndex].endpoints[endpointIndex].status !== 'error'){
             updateEndpointStatus(serviceId, endpointId, 'completed');
        }
   };

   // Helpers para actualizar el estado inmutablemente (podrían ir a un hook o utils)
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


  const handleEndSession = () => {
    if (!captureData) return;
    const finalResults: SessionResults = {
        ...captureData,
        endTime: Date.now()
    };
    setCaptureData(finalResults); // Actualizar estado local por si acaso
    setResults(finalResults); // Pasar los resultados finales al componente padre
    setIsCapturing(false); // Detener captura
    // removeAxiosInterceptor(); // Asegurarse de limpiar el interceptor
    goToReport(); // Ir a la vista de reporte
  };

  // Comprobar si todos los endpoints están finalizados (completed o error)
  const allDone = captureData?.services.every(s =>
    s.endpoints.every(e => e.status === 'completed' || e.status === 'error')
  ) ?? false;


  if (!captureData) {
    return <div className="pdt-view">Cargando configuración...</div>;
  }

  return (
    <div className="pdt-capture-mode pdt-view">
      <h2>Modo Captura / Ejecución</h2>
      {isCapturing ? (
        <p>Monitorizando llamadas API y ejecutando pruebas...</p>
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
                   <span className="pdt-endpoint-key">{endpoint.config.key}</span>
                   <span className="pdt-endpoint-url">({endpoint.config.url})</span>
                   <span className="pdt-endpoint-status">{endpoint.status} [{endpoint.calls.length}/{endpoint.config.requests}]</span>
                   {/* Mostrar botón de ejecución solo si está pendiente */}
                   {endpoint.status === 'pending' && isCapturing && (
                       <button
                           onClick={() => handleRunTest(service.config.id, endpoint.config.id)}
                           className="pdt-button pdt-button-small"
                        >
                           ▶️ Ejecutar Test
                       </button>
                   )}
                   {/* Podríamos mostrar progreso o resumen de llamadas aquí */}
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
           disabled={!allDone || !isCapturing} // Habilitar solo si todo acabó y aún se está "capturando"
        >
           Finalizar Sesión y Ver Reporte ➔
        </button>
        {/* Botón para detener/pausar captura podría ir aquí */}
      </div>
    </div>
  );
};

export default CaptureMode;