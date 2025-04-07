import React, { useState } from "react";
import "./SessionSetup.css";
import { SessionConfig, ServiceConfig, EndpointConfig } from "../../types"; // Importamos tipos

interface SessionSetupProps {
  currentConfig: SessionConfig | null; // Para poder editar una existente
  setSessionConfig: (config: SessionConfig) => void;
  goToCapture: () => void;
}

const SessionSetup: React.FC<SessionSetupProps> = ({
  currentConfig,
  setSessionConfig,
  goToCapture,
}) => {
  // Estado local para manejar los formularios antes de "guardar" en el estado principal
  const [services, setServices] = useState<ServiceConfig[]>(
    currentConfig?.services ?? []
  );

  const handleAddService = () => {
    const newService: ServiceConfig = {
      id: `service-${Date.now()}`, // ID simple basado en timestamp
      name: `Nuevo Servicio ${services.length + 1}`,
      endpoints: [],
    };
    setServices([...services, newService]);
  };

  // Funciones para añadir/editar/eliminar endpoints y servicios irán aquí...
  // handleAddEndpoint, handleRemoveService, handleUpdateService, etc.

  const handleStartCapture = () => {
    // Validaciones básicas (ej: al menos un servicio con un endpoint)
    if (
      services.length === 0 ||
      services.every((s) => s.endpoints.length === 0)
    ) {
      alert("Debes configurar al menos un servicio con un endpoint.");
      return;
    }
    if (
      services.some((s) =>
        s.endpoints.some((e) => !e.key || !e.url || e.requests <= 0)
      )
    ) {
      alert(
        "Revisa los endpoints. Todos deben tener Key, URL y nº de Peticiones > 0."
      );
      return;
    }

    const finalConfig: SessionConfig = { services };
    setSessionConfig(finalConfig); // Guardar la configuración en el estado principal
    goToCapture(); // Navegar a la siguiente pantalla
  };

  return (
    <div className="pdt-session-setup pdt-view">
      <h2>Configurar Sesión de Pruebas</h2>
      <p>Define los servicios y endpoints que quieres monitorear.</p>

      <div className="pdt-services-list">
        {/* Aquí iría el mapeo de los servicios y sus formularios */}
        {services.map((service, index) => (
          <div key={service.id} className="pdt-service-config">
            {/* Componente ServiceForm (a crear) iría aquí */}
            <p>Servicio: {service.name} (Formulario pendiente)</p>
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
          disabled={services.length === 0} // Deshabilitar si no hay servicios
        >
          Iniciar Captura ➔
        </button>
      </div>
    </div>
  );
};

export default SessionSetup;
