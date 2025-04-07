import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { CallMetric } from "../types"; // Importar tipos necesarios

// Tipamos la función callback que procesará la métrica
type MetricCallback = (
  metric: CallMetric,
  url: string,
  key?: string /* key mapeada si existe */
) => void;

let interceptorId: number | null = null;
let startTimeStore: Record<string, number> = {}; // Para guardar tiempos de inicio por URL o ID único de request

// Función para configurar el interceptor
export const setupAxiosInterceptor = (
  callback: MetricCallback /* endpointMap: EndpointMap = {} */
) => {
  if (interceptorId !== null) {
    console.warn("Interceptor de Axios ya está configurado.");
    return;
  }

  interceptorId = axios.interceptors.request.use(
    (config: AxiosRequestConfig): AxiosRequestConfig => {
      // Generar un ID único para esta request si no existe en headers
      // Podríamos usar config.url + timestamp o una librería uuid
      const requestId =
        config.headers?.["X-Request-ID"] || `${config.url}-${Date.now()}`;
      config.headers = config.headers || {};
      config.headers["X-Request-ID"] = requestId;

      // Guardar el tiempo de inicio asociado a este ID
      startTimeStore[requestId] = performance.now();
      console.log(
        `Axios Request [${requestId}]:`,
        config.method?.toUpperCase(),
        config.url
      );
      return config;
    },
    (error: AxiosError) => {
      // Manejar errores de configuración de request si es necesario
      console.error("Axios Request Error (Setup):", error);
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      const requestId = response.config.headers?.["X-Request-ID"];
      const startTime = requestId ? startTimeStore[requestId] : null;

      if (startTime && requestId) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const metric: CallMetric = {
          timestamp: Date.now(),
          duration: parseFloat(duration.toFixed(2)), // Redondear a 2 decimales
          status: response.status,
        };
        // Encontrar la key mapeada si existe (lógica pendiente)
        callback(metric, response.config.url || "");
        delete startTimeStore[requestId]; // Limpiar memoria
        console.log(
          `Axios Response Success [${requestId}]: ${
            response.status
          } in ${duration.toFixed(2)}ms`
        );
      } else {
        console.warn(
          "No se encontró tiempo de inicio para la respuesta:",
          response.config.url
        );
      }
      return response;
    },
    (error: AxiosError) => {
      const requestId = error.config?.headers?.["X-Request-ID"];
      const startTime = requestId ? startTimeStore[requestId] : null;

      if (startTime && requestId && error.config?.url) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const metric: CallMetric = {
          timestamp: Date.now(),
          duration: parseFloat(duration.toFixed(2)),
          status: error.response?.status || 0, // 0 si no hay respuesta (ej. network error)
          error: error.message,
        };
        // Encontrar la key mapeada si existe (lógica pendiente)
        callback(metric, error.config.url /* key */);
        delete startTimeStore[requestId]; // Limpiar memoria
        console.error(
          `Axios Response Error [${requestId}]: ${
            metric.status
          } in ${duration.toFixed(2)}ms - ${error.message}`
        );
      } else if (error.config?.url) {
        // Error ocurrió antes de que se pudiera registrar startTime o falta ID
        const metric: CallMetric = {
          timestamp: Date.now(),
          duration: 0,
          status: error.response?.status || 0,
          error: `Request failed: ${error.message}`,
        };
        callback(metric, error.config.url /* key */);
        console.error(
          `Axios Response Error (sin startTime): ${error.config?.url} - ${error.message}`
        );
      } else {
        console.error(
          "Axios Response Error (configuración desconocida):",
          error
        );
      }

      return Promise.reject(error);
    }
  );
  console.log("Interceptor de Axios configurado.");
};

// Función para remover el interceptor
export const removeAxiosInterceptor = () => {
  if (interceptorId !== null) {
    axios.interceptors.request.eject(interceptorId);
    // Nota: Los interceptores de respuesta no tienen un método eject directo por ID individual fácilmente.
    // La forma más limpia podría ser manejar una bandera global o re-instanciar axios si es crítico.
    // Por simplicidad aquí, solo limpiamos el de request y el store.
    interceptorId = null;
    startTimeStore = {}; // Limpiar tiempos pendientes
    console.log("Interceptor de Axios removido.");
  }
};
