// Define los posibles estados de una vista/pantalla
export type ViewType = "HOME" | "SETUP" | "CAPTURE" | "REPORT";

// Configuración para un endpoint individual
export interface EndpointConfig {
  id: string;
  key: string; // Nombre lógico
  urlFragment: string; // FRAGMENTO de URL a buscar (antes era 'url')
  requests: number; // Número de peticiones (relevante para modo manual, menos para auto)
}

// Configuración para un servicio (agrupa endpoints)
export interface ServiceConfig {
  id: string; // Un ID único para React keys
  name: string;
  endpoints: EndpointConfig[];
}

// Configuración completa de la sesión de pruebas
export interface SessionConfig {
  services: ServiceConfig[];
  // Podríamos añadir opciones globales aquí, como delays, etc.
}

// Métrica individual de una llamada API
export interface CallMetric {
  timestamp: number; // Momento de finalización
  duration: number; // Tiempo en ms
  status: number; // Código de estado HTTP
  error?: string; // Mensaje de error si lo hubo
}

// Estado y resultados de un endpoint durante/después de la captura
export type EndpointStatus = "pending" | "running" | "completed" | "error";

export interface EndpointResult {
  config: EndpointConfig; // Referencia a la configuración original
  status: EndpointStatus;
  calls: CallMetric[];
}

// Estado y resultados de un servicio durante/después de la captura
export interface ServiceResult {
  config: ServiceConfig; // Referencia a la configuración original
  endpoints: EndpointResult[];
}

// Resultados completos de la sesión de captura
export interface SessionResults {
  config: SessionConfig; // La configuración usada
  startTime: number;
  endTime?: number;
  services: ServiceResult[];
}

// Para el mapeo opcional si se implementa la detección automática
export type EndpointMap = Record<string, string>; // key: url
