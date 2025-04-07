const EndpointAnalysis = ({ endpoint, stats, metrics }) => (
    <div className="endpoint-card">
      <h3>{endpoint}</h3>
      
      <div className="status-code-distribution">
        {Object.entries(stats.statusCodes).map(([code, data]) => (
          <div key={code} className="status-code">
            <span>HTTP {code}</span>
            <ProgressBar value={data.count} max={stats.totalRequests} />
            <span>{data.count} requests</span>
          </div>
        ))}
      </div>
  
      <div className="advanced-metrics">
        <MetricChart 
          title="Response Time Distribution"
          data={metrics.map(m => m.duration)}
          type="histogram"
        />
        
        <MetricChart
          title="Success Rate Over Time"
          data={metrics.map(m => ({ x: m.timestamp, y: m.success ? 1 : 0 }))}
          type="line"
        />
      </div>
    </div>
  );