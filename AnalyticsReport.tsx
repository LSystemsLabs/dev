const AnalyticsReport = ({ sessions }) => {
    const calculateStats = (session: SessionData): Record<string, EndpointStats> => {
      // Lógica compleja de cálculo estadístico
    };
  
    return (
      <div className="report-container">
        {Object.entries(sessions).map(([service, session]) => {
          const stats = calculateStats(session);
          
          return (
            <div key={service} className="service-report">
              <h2>Service: {service}</h2>
              <div className="time-range">
                {session.startTime.toISOString()} - {session.endTime?.toISOString() || 'Active'}
              </div>
              
              <div className="global-stats">
                <StatCard title="Total Requests" value={session.globalStats.totalRequests} />
                <StatCard title="Concurrency Peak" value={session.globalStats.concurrencyPeak} />
                <StatCard title="Data Transferred" 
                  value={`${(session.globalStats.networkUsage.totalResponseSize / 1024).toFixed(2)} KB`} />
              </div>
  
              {session.extraEndpoints.length > 0 && (
                <div className="extra-endpoints">
                  <h3>Unexpected Endpoints Called:</h3>
                  <ul>
                    {session.extraEndpoints.map(ep => <li key={ep}>{ep}</li>)}
                  </ul>
                </div>
              )}
  
              <div className="endpoints-analysis">
                {Object.entries(stats).map(([endpoint, epStats]) => (
                  <EndpointAnalysis 
                    key={endpoint}
                    endpoint={endpoint}
                    stats={epStats}
                    metrics={session.endpointsMetrics[endpoint]}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };