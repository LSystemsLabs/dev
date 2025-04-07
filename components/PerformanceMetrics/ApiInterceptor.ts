import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export interface EndpointMetrics {
  attempts: number;
  totalResponseTime: number;
  responseTimes: number[];
}

export interface MetricsData {
  [endpoint: string]: {
    [statusCode: number]: EndpointMetrics;
  };
}

// Objeto global donde se almacenarán las métricas por servicio.
export const metrics: { [service: string]: MetricsData } = {};

/**
 * Configura un interceptor en Axios.
 * @param serviceName - Nombre del servicio (API) a monitorizar.
 * @param endpointMapping - Mapeo de endpoints: { urlOriginal: nombreMapeado }.
 */
export function setupInterceptor(
  serviceName: string,
  endpointMapping: { [key: string]: string }
) {
  axios.interceptors.request.use((config: AxiosRequestConfig) => {
    // Se agrega un header con el timestamp inicial.
    config.headers = config.headers || {};
    config.headers["request-startTime"] = Date.now();
    return config;
  });

  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      const startTime = response.config.headers
        ? (response.config.headers["request-startTime"] as number)
        : Date.now();
      const duration = Date.now() - startTime;
      const originalEndpoint = response.config.url || "unknown";
      // Si el endpoint no está mapeado, se usa el mismo valor (y podrías agregarlo dinámicamente).
      const mappedEndpoint =
        endpointMapping[originalEndpoint] || originalEndpoint;

      // Aseguramos que el objeto para el servicio y el endpoint exista.
      if (!metrics[serviceName]) {
        metrics[serviceName] = {};
      }
      if (!metrics[serviceName][mappedEndpoint]) {
        metrics[serviceName][mappedEndpoint] = {};
      }
      const statusCode = response.status;
      if (!metrics[serviceName][mappedEndpoint][statusCode]) {
        metrics[serviceName][mappedEndpoint][statusCode] = {
          attempts: 0,
          totalResponseTime: 0,
          responseTimes: [],
        };
      }
      // Actualizamos las métricas.
      metrics[serviceName][mappedEndpoint][statusCode].attempts++;
      metrics[serviceName][mappedEndpoint][statusCode].totalResponseTime +=
        duration;
      metrics[serviceName][mappedEndpoint][statusCode].responseTimes.push(
        duration
      );
      return response;
    },
    (error) => {
      // Puedes extender el manejo de errores si deseas capturar métricas de fallos.
      return Promise.reject(error);
    }
  );
}

/**
 * Función para obtener las métricas capturadas.
 */
export function getMetrics() {
  return metrics;
}
