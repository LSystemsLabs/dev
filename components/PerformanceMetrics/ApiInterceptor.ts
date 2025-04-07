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
 * Configura el interceptor en Axios para capturar las métricas.
 * @param serviceName - Nombre del servicio.
 * @param endpointMapping - Mapeo de endpoints (ej. { "/api/users": "getUsers" }).
 */
export function setupInterceptor(
  serviceName: string,
  endpointMapping: { [key: string]: string } = {}
) {
  axios.interceptors.request.use((config: AxiosRequestConfig) => {
    config.headers = config.headers || {};
    config.headers["request-startTime"] = Date.now();
    return config;
  });

  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      const startTime =
        response.config.headers && response.config.headers["request-startTime"]
          ? Number(response.config.headers["request-startTime"])
          : Date.now();
      const duration = Date.now() - startTime;
      const originalEndpoint = response.config.url || "unknown";
      const mappedEndpoint =
        endpointMapping[originalEndpoint] || originalEndpoint;
      const statusCode = response.status;

      if (!metrics[serviceName]) {
        metrics[serviceName] = {};
      }
      if (!metrics[serviceName][mappedEndpoint]) {
        metrics[serviceName][mappedEndpoint] = {};
      }
      if (!metrics[serviceName][mappedEndpoint][statusCode]) {
        metrics[serviceName][mappedEndpoint][statusCode] = {
          attempts: 0,
          totalResponseTime: 0,
          responseTimes: [],
        };
      }
      const metric = metrics[serviceName][mappedEndpoint][statusCode];
      metric.attempts++;
      metric.totalResponseTime += duration;
      metric.responseTimes.push(duration);

      return response;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}

/**
 * Retorna el objeto con las métricas acumuladas.
 */
export function getMetrics() {
  return metrics;
}
