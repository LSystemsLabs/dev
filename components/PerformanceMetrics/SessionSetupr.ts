// src/components/PerformanceDevTool/components/SessionSetup/SessionSetup.tsx
import React, { useState, ChangeEvent } from "react";
import "./SessionSetup.css"; // Asegúrate de que los estilos se actualicen también (ver abajo)
import { SessionConfig, ServiceConfig, EndpointConfig } from "../../types";

interface SessionSetupProps {
  currentConfig: SessionConfig | null;
  setSessionConfig: (config: SessionConfig) => void;
  goToCapture: () => void;
}

const DEFAULT_QUICK_SERVICE_NAME = "Quick Service";

const SessionSetup: React.FC<SessionSetupProps> = ({
  currentConfig,
  setSessionConfig,
  goToCapture,
}) => {
  // Estado para la configuración manual/visualización
  const [services, setServices] = useState<ServiceConfig[]>(
    currentConfig?.services ?? []
  );

  // --- Estados para el Modo Rápido ---
  const [quickInputText, setQuickInputText] = useState<string>("");
  const [quickInputRequests, setQuickInputRequests] = useState<number>(5); // Default 5 requests
  const [quickInputError, setQuickInputError] = useState<string | null>(null);

  // --- Manejadores de Servicios (Manual) ---
  // (Sin cambios respecto a la versión anterior)
  const handleAddService = () => {
    const newService: ServiceConfig = {
      id: `service-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `Nuevo Servicio ${services.length + 1}`,
      endpoints: [],
    };
    setServices([...services, newService]);
  };

  const handleRemoveService = (serviceId: string) => {
    setServices(services.filter((s) => s.id !== serviceId));
  };

  const handleUpdateServiceName = (serviceId: string, newName: string) => {
    setServices(
      services.map((s) => (s.id === serviceId ? { ...s, name: newName } : s))
    );
  };

  // --- Manejadores de Endpoints (Manual) ---
  // (Sin cambios respecto a la versión anterior)
  const handleAddEndpoint = (serviceId: string) => {
    const newEndpoint: EndpointConfig = {
      id: `endpoint-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
      key: "",
      url: "",
      requests: 1,
    };
    setServices(
      services.map((s) =>
        s.id === serviceId
          ? { ...s, endpoints: [...s.endpoints, newEndpoint] }
          : s
      )
    );
  };

  const handleRemoveEndpoint = (serviceId: string, endpointId: string) => {
    setServices(
      services.map((s) =>
        s.id === serviceId
          ? { ...s, endpoints: s.endpoints.filter((e) => e.id !== endpointId) }
          : s
      )
    );
  };

  const handleUpdateEndpoint = (
    serviceId: string,
    endpointId: string,
    field: keyof Omit<EndpointConfig, "id">,
    value: string
  ) => {
    setServices(
      services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              endpoints: s.endpoints.map((e) => {
                if (e.id === endpointId) {
                  const updatedValue =
                    field === "requests" ? parseInt(value, 10) || 0 : value;
                  return { ...e, [field]: updatedValue };
                }
                return e;
              }),
            }
          : s
      )
    );
  };

 // src/components/PerformanceDevTool/components/SessionSetup/SessionSetup.tsx
// ... (imports y estado sin cambios) ...

// --- Lógica del Modo Rápido ---
const handleProcessQuickInput = () => {
  // ... (validaciones iniciales) ...
  for (let i = 0; i < pairs.length; i++) {
      // ... (parsing de key:value) ...
      const key = parts[0].trim();
      const urlFrag = parts[1].trim(); // Cambiado el nombre de la variable

      if (!key || !urlFrag) { // Comprobar urlFrag
           setQuickInputError(`Clave o Fragmento URL vacío en el elemento <span class="math-inline">\{i \+ 1\}\: "</span>{pair}".`);
           errorFound = true;
           break;
      }

      // Ya no validamos con isValidHttpUrl aquí, porque es un fragmento
      // if (!isValidHttpUrl(urlFrag)) { ... } // ELIMINAR ESTA VALIDACIÓN

      newEndpoints.push({
          id: `endpoint-<span class="math-inline">\{Date\.now\(\)\}\-</span>{Math.random().toString(36).substring(2, 7)}-${i}`,
          key: key,
          urlFragment: urlFrag, // Guardar como urlFragment
          requests: quickInputRequests,
      });
  }
   // ... (resto de la función sin cambios) ...
};

// --- Lógica Final y Validación Común ---
const handleStartCapture = () => {
  // ... (validaciones de servicios y endpoints vacíos) ...
   if (services.some(s => s.endpoints.some(e => !e.key || !e.urlFragment || e.requests <= 0))) { // Cambiado a urlFragment
      alert("Revisa los endpoints:\n- Todos deben tener un 'Key'.\n- Todos deben tener un 'Fragmento de URL'.\n- El número de 'Peticiones' debe ser > 0.");
      return;
   }
  // ELIMINAR la validación isValidHttpUrl aquí también
  // if (services.some(s => s.endpoints.some(e => !isValidHttpUrl(e.urlFragment)))) { ... }

  const finalConfig: SessionConfig = { services };
  setSessionConfig(finalConfig);
  goToCapture();
};

// ELIMINAR la función isValidHttpUrl si ya no se usa en ningún otro sitio

return (
  <div className="pdt-session-setup pdt-view">
      {/* ... (Modo Rápido sin cambios visuales relevantes, pero procesa urlFragment) ... */}

       <hr className="pdt-divider" />

       <h3>Configuración Detallada</h3>
       {/* ... (resto sin cambios hasta la fila del endpoint) ... */}

                   <div className="pdt-endpoints-list">
                      {service.endpoints.length > 0 ? (
                          <>
                              <div className="pdt-endpoint-header-row">
                                  <span>Key (Nombre Corto)</span>
                                  <span>Fragmento URL (a buscar)</span> {/* Cambiado Label */}
                                  <span>Peticiones (Manual)</span> {/* Aclarar que es para modo manual */}
                                  <span>Acción</span>
                              </div>
                              {service.endpoints.map((endpoint) => (
                                  <div key={endpoint.id} className="pdt-endpoint-config-row">
                                      <input /* Input para KEY sin cambios */
                                          type="text"
                                          value={endpoint.key}
                                          onChange={(e) => handleUpdateEndpoint(service.id, endpoint.id, 'key', e.target.value)}
                                          placeholder="ej: getUserData"
                                          className="pdt-input"
                                      />
                                      <input /* Input para URL FRAGMENT */
                                          type="text"
                                          value={endpoint.urlFragment}
                                          onChange={(e) => handleUpdateEndpoint(service.id, endpoint.id, 'urlFragment', e.target.value)} // Actualiza urlFragment
                                          placeholder="ej: /users/1 o sv/rr/gateway" // Placeholder actualizado
                                          className="pdt-input"
                                          title="Fragmento de URL que debe estar contenido en la petición real"
                                      />
                                      <input /* Input para REQUESTS sin cambios funcionales */
                                          type="number"
                                          value={endpoint.requests}
                                          onChange={(e) => handleUpdateEndpoint(service.id, endpoint.id, 'requests', e.target.value)}
                                          min="1"
                                          className="pdt-input pdt-input-requests"
                                          title="Número de veces a ejecutar con el botón 'Ejecutar Manual'"
                                      />
                                      {/* ... (Botón eliminar sin cambios) ... */}
                                  </div>
                              ))}
                          </>
                      {/* ... (resto sin cambios) ... */}
                  </div>
              {/* ... (resto sin cambios) ... */}
           </div>
           ))}
      </div>
      {/* ... (Acciones Finales sin cambios) ... */}
  </div>
);