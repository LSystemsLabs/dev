export interface EndpointDefinition {
  key: string; // Nombre lógico del endpoint (ej. "getUsers")
  url: string; // URL real (ej. "/api/users")
}

export interface ServiceDefinition {
  serviceName: string; // Nombre del servicio (ej. "Service1")
  endpoints: EndpointDefinition[];
  requestsPerEndpoint: number; // Número de peticiones que se realizarán a cada endpoint
}

export interface SessionData {
  sessionName: string;
  services: ServiceDefinition[];
}

export enum DevToolStep {
  HOME = "HOME",
  SESSION_SETUP = "SESSION_SETUP",
  CAPTURE = "CAPTURE",
  REPORT = "REPORT",
}
