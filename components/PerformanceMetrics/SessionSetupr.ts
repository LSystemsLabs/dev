// src/components/PerformanceDevTool/components/SessionSetup/SessionSetup.tsx
import React, { useState, ChangeEvent } from "react";
import "./SessionSetup.css";
import { SessionConfig, ServiceConfig, EndpointConfig } from "../../types";

interface SessionSetupProps {
  currentConfig: SessionConfig | null;
  setSessionConfig: (config: SessionConfig) => void;
  goToCapture: () => void;
}

const SessionSetup: React.FC<SessionSetupProps> = ({
  currentConfig,
  setSessionConfig,
  goToCapture,
}) => {
  // Estado local para manejar los servicios mientras se configuran
  const [services, setServices] = useState<ServiceConfig[]>(
    currentConfig?.services ?? []
  );

  // --- Manejadores de Servicios ---

  const handleAddService = () => {
    const newService: ServiceConfig = {
      id: `service-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // ID más único
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

  // --- Manejadores de Endpoints ---

  const handleAddEndpoint = (serviceId: string) => {
    const newEndpoint: EndpointConfig = {
      id: `endpoint-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`,
      key: "",
      url: "",
      requests: 1, // Valor por defecto
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

  // Actualiza un campo específico de un endpoint
  const handleUpdateEndpoint = (
    serviceId: string,
    endpointId: string,
    field: keyof Omit<EndpointConfig, "id">, // Excluimos 'id' de ser actualizable aquí
    value: string
  ) => {
    setServices(
      services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              endpoints: s.endpoints.map((e) => {
                if (e.id === endpointId) {
                  // Convertir a número si el campo es 'requests'
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

  // --- Lógica Final ---

  const handleStartCapture = () => {
    // Validaciones
    if (services.length === 0) {
      alert("Debes configurar al menos un servicio.");
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
        "Revisa los endpoints:\n- Todos deben tener un 'Key' (nombre corto).\n- Todos deben tener una 'URL'.\n- El número de 'Peticiones' debe ser mayor a 0."
      );
      return;
    }
    // Validación de URL (básica)
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

  // Helper simple para validar URL
  function isValidHttpUrl(string: string): boolean {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
  }

  return (
    <div className="pdt-session-setup pdt-view">
      <h2>Configurar Sesión de Pruebas</h2>
      <p>Define los servicios y endpoints que quieres monitorear.</p>

      <div className="pdt-services-list">
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
              {service.endpoints.length > 0 && (
                <div className="pdt-endpoint-header-row">
                  <span>Key (Nombre Corto)</span>
                  <span>URL Completa</span>
                  <span>Peticiones</span>
                  <span>Acción</span>
                </div>
              )}
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

      <div className="pdt-setup-actions">
        <button className="pdt-button" onClick={handleAddService}>
          + Añadir Servicio
        </button>
        <button
          className="pdt-button pdt-button-primary"
          onClick={handleStartCapture}
          disabled={services.length === 0}
        >
          Iniciar Captura ➔
        </button>
      </div>
    </div>
  );
};

export default SessionSetup;
