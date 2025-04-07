interface RequestMetric {
  id: string;
  url: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
  success: boolean;
  requestBody?: any;
  responseBody?: any;
  headers?: Record<string, string>;
  retryCount?: number;
  errorMessage?: string;
}

interface EndpointStats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  statusCodes: Record<
    number,
    {
      count: number;
      examples: RequestMetric[];
    }
  >;
  percentiles: {
    p95: number;
    p99: number;
  };
}

interface SessionData {
  service: string;
  expectedEndpoints: string[];
  extraEndpoints: string[];
  endpointsMetrics: Record<string, Record<number, RequestMetric[]>>;
  startTime: Date;
  endTime?: Date;
  globalStats: {
    totalRequests: number;
    concurrencyPeak: number;
    networkUsage: {
      totalRequestSize: number;
      totalResponseSize: number;
    };
  };
}
