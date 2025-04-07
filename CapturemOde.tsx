import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react'; // Añadir useCallback
import { CallMetric, SessionConfig, SessionResults } from '../../types';
import { removeAxiosInterceptor, setupAxiosInterceptor } from '../../utils/axiosInterceptor'; // Importar funciones del interceptor
import './CaptureMode.css';

interface CaptureModeProps {
 sessionConfig: SessionConfig;
 setResults: (results: SessionResults) => void;
 goToReport: () => void;
}

const CaptureMode: React.FC<CaptureModeProps> = ({ sessionConfig, setResults, goToReport }) => {
 const [captureData, setCaptureData] = useState<SessionResults | null>(null);
 const [isCapturing, setIsCapturing] = useState<boolean>(true); // Indica si estamos en modo captura activo

 // --- Callback para el Interceptor ---
 // Usamos useCallback para evitar que esta función se recree en cada render
 // y cause re-configuraciones innecesarias del interceptor.
 const handleInterceptedCall = useCallback((metric: CallMetric, interceptedUrl: string) => {
   setCaptureData(prevData => {
       if (!prevData) return null; // Si no hay datos, no hacer nada

       let matchFound = false;
       const updatedServices = prevData.services.map(service => {
           // No buscar más si ya encontramos un match
           if (matchFound) return service;

           let serviceWasUpdated = false;
           const updatedEndpoints = service.endpoints.map(endpoint => {
                // No buscar más si ya encontramos un match en este servicio o globalmente
                if (matchFound || serviceWasUpdated) return endpoint;

                // *** Lógica de Matching ***
                // Comprueba si la URL interceptada CONTIENE el fragmento configurado
                if (interceptedUrl.includes(endpoint.config.urlFragment)) {
                    console.log(`Match found! Intercepted: ${interceptedUrl}, Matched Fragment: ${endpoint.config.urlFragment} (Key: ${endpoint.config.key})`);
                    matchFound = true; // Marcar que encontramos un match global
                    serviceWasUpdated = true; // Marcar que este servicio necesita actualizarse

                    // Decidir nuevo estado: si es un error, marcar como error. Si no, marcar como 'running'
                    let newStatus = endpoint.status;
                    if (metric.error || metric.status >= 400) {
                        newStatus = 'error'; // Marcar como error si la llamada falló
                    } else if (endpoint.status === 'pending') {
                        newStatus = 'running'; // Marcar como 'running' solo la primera vez que se intercepta
                    }
                    // Si ya era 'running' o 'error', se mantiene así, solo se añaden métricas.

                    return {
                        ...endpoint,
                        status: newStatus,
                        calls: [...endpoint.calls, metric], // Añadir la nueva métrica
                    };
                }
                return endpoint; // No hay match para este endpoint
           });

           // Si hubo cambios en los endpoints de este servicio, retornar el servicio actualizado
           if (serviceWasUpdated) {
               return { ...service, endpoints: updatedEndpoints };
           }
           return service; // Sin cambios en este servicio
       });

       // Solo actualizar el estado si realmente hubo algún cambio
       if (matchFound) {
            return { ...prevData, services: updatedServices };
       }

       // Si no hubo match en ningún endpoint, retornar el estado anterior sin cambios
       return prevData;
   });

 }, []); // El array vacío asegura que la función no cambie entre renders

 // --- Efecto para Configurar y Limpiar Interceptor ---
 useEffect(() => {
   // Inicializar estructura de resultados
   const initialResults: SessionResults = {
     config: sessionConfig,
     startTime: Date.now(),
     services: sessionConfig.services.map(serviceConfig => ({
       config: serviceConfig,
       endpoints: serviceConfig.endpoints.map(endpointConfig => ({
         config: endpointConfig,
         status: 'pending', // Estado inicial
         calls: [],
       })),
     })),
   };
   setCaptureData(initialResults);
   setIsCapturing(true); // Marcar como activo

   // Configurar el interceptor cuando el componente monta
   console.log("Setting up Axios Interceptor for PerformanceDevTool");
   setupAxiosInterceptor(handleInterceptedCall);

   // Limpiar el interceptor cuando el componente desmonta
   return () => {
     console.log("Removing Axios Interceptor for PerformanceDevTool");
     removeAxiosInterceptor();
     setIsCapturing(false); // Marcar como inactivo
   };
   // La dependencia de handleInterceptedCall asegura que si cambia (no debería por useCallback), se reconfigure.
   // sessionConfig también es dependencia para reiniciar si cambia la config.
 }, [sessionConfig, handleInterceptedCall]);

 // --- Ejecución Manual (se mantiene, pero su propósito es ahora secundario) ---
 const handleRunTest = async (serviceId: string, endpointId: string) => {
   if (!captureData) return;
   // (La lógica interna de handleRunTest con axios.get se mantiene igual que antes)
   // ... (código de handleRunTest de la versión anterior) ...
   // NOTA: Ahora usa `endpointConfig.urlFragment`. Si quieres que la ejecución manual
   // use una URL completa, necesitarías añadir otro campo a EndpointConfig o
   // construir la URL aquí (ej: baseURL + fragment). Por simplicidad,
   // asumiremos que `urlFragment` puede ser una URL completa si se quiere probar manualmente así.
   // O modificamos handleRunTest para usar axios.get(endpointConfig.urlFragment) si el fragmento
   // es casualmente una URL completa válida para pruebas.

   const serviceIndex = captureData.services.findIndex(s => s.config.id === serviceId);
   if (serviceIndex === -1) return;
   const endpointIndex = captureData.services[serviceIndex].endpoints.findIndex(e => e.config.id === endpointId);
   if (endpointIndex === -1) return;

   const currentEndpointState = captureData.services[serviceIndex].endpoints[endpointIndex];
   const endpointConfig = currentEndpointState.config;

   if (currentEndpointState.status !== 'pending' && currentEndpointState.status !== 'running') {
       console.warn(`Manual run for ${endpointConfig.key} skipped. Status: ${currentEndpointState.status}`);
       // Permitir correr aunque esté 'running' por el interceptor? Podría ser confuso.
       // Mejor permitir solo desde 'pending'.
        if (currentEndpointState.status !== 'pending') return;
   }

   updateEndpointStatus(serviceId, endpointId, 'running'); // Marcar como corriendo (manualmente)
   console.log(`[Manual Run] Executing ${endpointConfig.requests} requests for [${endpointConfig.key}] (${endpointConfig.urlFragment})...`);

   let endpointFailed = false;

   for (let i = 0; i < endpointConfig.requests; i++) {
     const startTime = performance.now();
     try {
       // Ejecutar usando el urlFragment. ¡Asegúrate de que sea una URL válida si usas este botón!
       const response = await axios.get(endpointConfig.urlFragment, {
           validateStatus: status => status >= 100 && status < 600,
       });
       const endTime = performance.now();
       const duration = endTime - startTime;
       const successMetric: CallMetric = { /* ... */ }; // igual que antes
       addCallMetric(serviceId, endpointId, successMetric);
       if (response.status >= 400) { /* ... */ }

     } catch (error) {
       // ... (manejo de error igual que antes) ...
       const errorMetric: CallMetric = { /* ... */ }; // igual que antes
       addCallMetric(serviceId, endpointId, errorMetric);
       endpointFailed = true;
       break;
     }
   }

   // Estado final MANUAL: solo 'completed' o 'error'. No vuelve a 'pending' o 'running'.
   updateEndpointStatus(serviceId, endpointId, endpointFailed ? 'error' : 'completed');
   console.log(`[Manual Run] Finished for [${endpointConfig.key}]. Status: ${endpointFailed ? 'error' : 'completed'}`);

 };


 // --- Finalizar Sesión (sin cambios) ---
 const handleEndSession = () => {
   // ... (igual que antes) ...
   if (!captureData) return;
   const finalResults: SessionResults = {
     ...captureData,
     endTime: Date.now(),
   };
   setCaptureData(finalResults);
   setResults(finalResults);
   setIsCapturing(false);
   // La limpieza del interceptor ocurre automáticamente al desmontar (o al navegar fuera)
   goToReport();
 };

 // --- Renderizado (ajustes menores) ---
 // ... (comprobación de captureData) ...

 return (
   <div className="pdt-capture-mode pdt-view">
     <h2>Modo Captura Automática</h2>
      {isCapturing ? (
       <p>Escuchando llamadas API de la aplicación que coincidan con los fragmentos configurados...</p>
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
                 {/* Mostrar fragmento y no URL completa aquí */}
                 <span className="pdt-endpoint-url" title={`Fragmento: ${endpoint.config.urlFragment}`}>
                     Frag: {endpoint.config.urlFragment}
                 </span>
                 {/* Mostrar solo contador de llamadas interceptadas */}
                 <span className="pdt-endpoint-status" title={`${endpoint.calls.length} llamadas interceptadas`}>
                     {endpoint.status} [{endpoint.calls.length}]
                 </span>
                 {/* El botón de ejecución manual ahora es secundario */}
                 {(endpoint.status === 'pending') && isCapturing && ( // Solo mostrar si está pendiente
                   <button
                     onClick={() => handleRunTest(service.config.id, endpoint.config.id)}
                     className="pdt-button pdt-button-small pdt-button-run"
                     title={`Ejecutar ${endpoint.config.requests} veces manualmente (requiere fragmento sea URL válida)`}
                   >
                     ▶️ Run Manual ({endpoint.config.requests})
                   </button>
                 )}
                  {(endpoint.status === 'running' || endpoint.status === 'completed' || endpoint.status === 'error') && (
                      <span className={`pdt-endpoint-done-indicator status-${endpoint.status}`}>
                          {endpoint.status === 'running' ? '👁️' : (endpoint.status === 'completed' ? '✅' : '❌')}
                      </span>
                  )}
               </li>
             ))}
           </ul>
         </div>
       ))}
     </div>
       {/* ... (Acciones finales sin cambios) ... */}
   </div>
 );
};

export default CaptureMode;