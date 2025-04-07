const servicesConfig = {
  service1: {
    endpoints: ["/api/v1/users", "/api/v1/products"],
    expectedStatusCodes: [200, 201, 400, 404, 500],
  },
  service2: {
    endpoints: ["/api/v2/data", "/api/v2/entities"],
    expectedStatusCodes: [200, 202, 304, 403],
  },
};

const App = () => {
  const { metrics } = useMetrics();

  return (
    <MetricsProvider config={servicesConfig}>
      <MainApp />

      <FloatingDevTools>
        <RealTimeMetricsViewer />
        <AnalyticsReport />
        <ComparisonTool services={["service1", "service2"]} />
      </FloatingDevTools>
    </MetricsProvider>
  );
};
