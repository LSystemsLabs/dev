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

  // --- Lógica del Modo Rápido ---

  const handleProcessQuickInput = () => {
    setQuickInputError(null); // Limpiar errores previos
    const trimmedInput = quickInputText.trim();

    if (!trimmedInput) {
      setQuickInputError("El campo de texto no puede estar vacío.");
      return;
    }
    if (quickInputRequests <= 0) {
      setQuickInputError("El número de peticiones debe ser mayor a 0.");
      return;
    }

    const pairs = trimmedInput.split(",");
    const newEndpoints: EndpointConfig[] = [];
    let errorFound = false;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].trim();
      if (!pair) continue; // Ignorar comas extra o elementos vacíos

      const parts = pair.split(/:(.+)/); // Divide por el primer ':' encontrado

      if (parts.length !== 3 || !parts[0] || !parts[1]) {
        // parts[2] es ''
        setQuickInputError(
          `Formato inválido en el elemento ${i + 1}: "${pair}". Use 'key:url'.`
        );
        errorFound = true;
        break;
      }

      const key = parts[0].trim();
      const url = parts[1].trim();

      if (!key || !url) {
        setQuickInputError(
          `Clave o URL vacía en el elemento ${i + 1}: "${pair}".`
        );
        errorFound = true;
        break;
      }

      if (!isValidHttpUrl(url)) {
        setQuickInputError(
          `URL inválida en el elemento ${
            i + 1
          } (${key}): "${url}". Debe incluir http:// o https://`
        );
        errorFound = true;
        break;
      }

      newEndpoints.push({
        id: `endpoint-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}-${i}`,
        key: key,
        url: url,
        requests: quickInputRequests, // Usar el número global de peticiones
      });
    }

    if (!errorFound && newEndpoints.length > 0) {
      // Decisión: Añadir a un servicio existente o crear/reemplazar uno?
      // Opción: Crear/Reemplazar un servicio llamado "Quick Service"
      const quickService: ServiceConfig = {
        id: `service-quick-${Date.now()}`,
        name: DEFAULT_QUICK_SERVICE_NAME,
        endpoints: newEndpoints,
      };
      // Reemplaza todos los servicios existentes con solo el Quick Service
      // setServices([quickService]);

      // Opción Alternativa: Añadir o fusionar con un servicio existente "Quick Service"
      // O simplemente añadirlo como uno más (lo más flexible)
      setServices((prevServices) => {
        // Eliminar cualquier servicio anterior llamado "Quick Service" para evitar duplicados si se procesa de nuevo
        const otherServices = prevServices.filter(
          (s) => s.name !== DEFAULT_QUICK_SERVICE_NAME
        );
        return [...otherServices, quickService];
      });

      // Limpiar campos de modo rápido tras éxito
      // setQuickInputText(''); // Opcional: limpiar el textarea
      setQuickInputError(null);
    } else if (!errorFound && newEndpoints.length === 0) {
      setQuickInputError(
        "No se encontraron pares key:url válidos en el texto."
      );
    }
  };

  // --- Lógica Final y Validación Común ---

  const handleStartCapture = () => {
    // Validaciones (igual que antes, pero ahora aplican a 'services' que puede venir de manual o rápido)
    if (services.length === 0) {
      alert(
        "Debes configurar al menos un servicio (manualmente o usando el modo rápido)."
      );
      return;
    }
    if (services.some((s) => s.endpoints.length === 0)) {
      alert(
        "Todos los servicios deben tener al menos un endpoint configurado."
      );
      return;
    }
    if (
      services.some((s) =>
        s.endpoints.some((e) => !e.key || !e.url || e.requests <= 0)
      )
    ) {
      alert(
        "Revisa los endpoints:\n- Todos deben tener un 'Key'.\n- Todos deben tener una 'URL'.\n- El número de 'Peticiones' debe ser > 0."
      );
      return;
    }
    if (services.some((s) => s.endpoints.some((e) => !isValidHttpUrl(e.url)))) {
      alert(
        "Una o más URLs no parecen válidas. Asegúrate de que incluyan http:// o https://"
      );
      return;
    }

    const finalConfig: SessionConfig = { services };
    setSessionConfig(finalConfig);
    goToCapture();
  };

  // Helper simple para validar URL (sin cambios)
  function isValidHttpUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  return (
    <div className="pdt-session-setup pdt-view">
      <h2>Configurar Sesión de Pruebas</h2>

      {/* --- Sección Modo Rápido --- */}
      <div className="pdt-quick-mode">
        <h3>Modo Rápido</h3>
        <p>
          Pega una lista de endpoints en formato{" "}
          <code>key1:url1, key2:url2, ...</code>
        </p>
        <textarea
          className="pdt-input pdt-textarea-quick"
          placeholder="Ej: getUser:https://api.example.com/users/1, getProducts:https://api.example.com/products"
          value={quickInputText}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setQuickInputText(e.target.value)
          }
          rows={4}
        />
        <div className="pdt-quick-mode-options">
          <label htmlFor="quickRequests">Peticiones por endpoint:</label>
          <input
            id="quickRequests"
            type="number"
            value={quickInputRequests}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setQuickInputRequests(parseInt(e.target.value, 10) || 1)
            }
            min="1"
            className="pdt-input pdt-input-requests"
          />
          <button
            className="pdt-button"
            onClick={handleProcessQuickInput}
            disabled={!quickInputText.trim()} // Deshabilitar si textarea está vacío
          >
            Procesar Entrada Rápida
          </button>
        </div>
        {quickInputError && (
          <p className="pdt-error-message">{quickInputError}</p>
        )}
      </div>

      {/* --- Divisor Visual --- */}
      <hr className="pdt-divider" />

      {/* --- Sección Modo Manual / Visualización --- */}
      <h3>Configuración Detallada</h3>
      <p>
        Añade o edita servicios y endpoints manualmente. Los endpoints del modo
        rápido aparecerán aquí.
      </p>
      <div className="pdt-services-list">
        {services.length === 0 && (
          <p className="pdt-no-services-message">
            Aún no has añadido servicios. Usa el modo rápido o el botón de
            abajo.
          </p>
        )}
        {services.map((service) => (
          <div key={service.id} className="pdt-service-config">
            <div className="pdt-service-header">
              <input
                type="text"
                value={service.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleUpdateServiceName(service.id, e.target.value)
                }
                placeholder="Nombre del Servicio"
                className="pdt-input pdt-input-service-name"
              />
              <button
                onClick={() => handleRemoveService(service.id)}
                className="pdt-button pdt-button-danger pdt-button-small"
                title="Eliminar Servicio"
              >
                🗑️
              </button>
            </div>

            <div className="pdt-endpoints-list">
              {service.endpoints.length > 0 ? (
                <>
                  <div className="pdt-endpoint-header-row">
                    <span>Key (Nombre Corto)</span>
                    <span>URL Completa</span>
                    <span>Peticiones</span>
                    <span>Acción</span>
                  </div>
                  {service.endpoints.map((endpoint) => (
                    <div key={endpoint.id} className="pdt-endpoint-config-row">
                      <input
                        type="text"
                        value={endpoint.key}
                        onChange={(e) =>
                          handleUpdateEndpoint(
                            service.id,
                            endpoint.id,
                            "key",
                            e.target.value
                          )
                        }
                        placeholder="ej: getUserData"
                        className="pdt-input"
                      />
                      <input
                        type="text"
                        value={endpoint.url}
                        onChange={(e) =>
                          handleUpdateEndpoint(
                            service.id,
                            endpoint.id,
                            "url",
                            e.target.value
                          )
                        }
                        placeholder="ej: https://api.example.com/users/1"
                        className="pdt-input"
                      />
                      <input
                        type="number"
                        value={endpoint.requests}
                        onChange={(e) =>
                          handleUpdateEndpoint(
                            service.id,
                            endpoint.id,
                            "requests",
                            e.target.value
                          )
                        }
                        min="1"
                        className="pdt-input pdt-input-requests"
                      />
                      <button
                        onClick={() =>
                          handleRemoveEndpoint(service.id, endpoint.id)
                        }
                        className="pdt-button pdt-button-danger pdt-button-small"
                        title="Eliminar Endpoint"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <p className="pdt-no-endpoints-message">
                  Este servicio no tiene endpoints.
                </p>
              )}
              <button
                onClick={() => handleAddEndpoint(service.id)}
                className="pdt-button pdt-button-add-endpoint"
              >
                + Añadir Endpoint a "{service.name}"
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Acciones Finales --- */}
      <div className="pdt-setup-actions">
        <button className="pdt-button" onClick={handleAddService}>
          + Añadir Servicio (Manual)
        </button>
        <button
          className="pdt-button pdt-button-primary"
          onClick={handleStartCapture}
          disabled={
            services.length === 0 ||
            services.some((s) => s.endpoints.length === 0)
          } // Deshabilitar si no hay servicios o alguno está vacío
        >
          Iniciar Captura ➔
        </button>
      </div>
    </div>
  );
};

export default SessionSetup;
