class MetricsCollector {
  private currentSessions: Record<string, SessionData> = {};
  private activeRequests = new Set<string>();

  constructor(
    private config: {
      enabled: boolean;
      services: Record<string, string[]>;
    }
  ) {}

  startSession(service: string) {
    this.currentSessions[service] = {
      service,
      expectedEndpoints: this.config.services[service] || [],
      extraEndpoints: [],
      endpointsMetrics: {},
      startTime: new Date(),
      globalStats: {
        totalRequests: 0,
        concurrencyPeak: 0,
        networkUsage: { totalRequestSize: 0, totalResponseSize: 0 },
      },
    };
  }

  logRequest(config: AxiosRequestConfig) {
    if (!this.config.enabled) return;

    const service = this.detectService(config.url);
    const requestId = uuid();

    this.activeRequests.add(requestId);
    this.updateConcurrency(service);

    config.metadata = {
      ...config.metadata,
      metricsStart: {
        timestamp: new Date(),
        requestSize: JSON.stringify(config.data)?.length || 0,
        service,
        requestId,
      },
    };
  }

  logResponse(response: AxiosResponse | AxiosError) {
    const { config, status, data } = isAxiosError(response)
      ? response.response
      : response;

    const metric: RequestMetric = {
      id: config.metadata.metricsStart.requestId,
      url: config.url!,
      method: config.method!.toUpperCase(),
      statusCode: status!,
      duration: Date.now() - config.metadata.metricsStart.timestamp.getTime(),
      timestamp: new Date(),
      success: status! >= 200 && status! < 400,
      requestBody: config.data,
      responseBody: data,
      headers: config.headers,
    };

    this.processMetric(metric, config.metadata.metricsStart.service);
    this.activeRequests.delete(config.metadata.metricsStart.requestId);
  }

  private processMetric(metric: RequestMetric, service: string) {
    const session = this.currentSessions[service];

    // Clasificación de endpoints
    const isExpected = session.expectedEndpoints.some((ep) =>
      metric.url.includes(ep)
    );

    if (!isExpected && !session.extraEndpoints.includes(metric.url)) {
      session.extraEndpoints.push(metric.url);
    }

    // Actualización de métricas
    if (!session.endpointsMetrics[metric.url]) {
      session.endpointsMetrics[metric.url] = {};
    }

    if (!session.endpointsMetrics[metric.url][metric.statusCode]) {
      session.endpointsMetrics[metric.url][metric.statusCode] = [];
    }

    session.endpointsMetrics[metric.url][metric.statusCode].push(metric);

    // Actualización de estadísticas globales
    session.globalStats.totalRequests++;
    session.globalStats.networkUsage.totalRequestSize +=
      JSON.stringify(metric.requestBody)?.length || 0;
    session.globalStats.networkUsage.totalResponseSize +=
      JSON.stringify(metric.responseBody)?.length || 0;
  }
}
