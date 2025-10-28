import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:3001';

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, violationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/stats`),
        axios.get(`${API_URL}/api/logs`),
        axios.get(`${API_URL}/api/violations`),
      ]);

      setStats(statsRes.data);
      setLogs(logsRes.data);
      setViolations(violationsRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to connect to backend. Make sure the server is running on port 3001.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for compliance rate chart
  const complianceData = logs.slice(-30).map((log, index) => ({
    index,
    verified: log.verified ? 1 : 0,
    riskScore: log.risk_score || 0,
  }));

  // Prepare data for risk score distribution
  const riskDistribution = {};
  logs.forEach(log => {
    const score = log.risk_score || 0;
    riskDistribution[score] = (riskDistribution[score] || 0) + 1;
  });

  const riskData = Object.entries(riskDistribution).map(([score, count]) => ({
    score: `Risk ${score}`,
    count,
  }));

  if (loading && !stats) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Verifications</h3>
            <div className="value">{stats.totalVerifications}</div>
            <div className="label">All time verifications</div>
          </div>

          <div className="stat-card">
            <h3>Compliance Rate</h3>
            <div className="value">{stats.complianceRate}%</div>
            <div className="label">Success rate</div>
          </div>

          <div className="stat-card">
            <h3>Violations</h3>
            <div className="value">{stats.totalViolations}</div>
            <div className="label">Policy violations</div>
          </div>

          <div className="stat-card">
            <h3>Successful Checks</h3>
            <div className="value">{stats.successfulVerifications}</div>
            <div className="label">Passed verifications</div>
          </div>
        </div>
      )}

      <div className="chart-container">
        <h2>Compliance Rate Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={complianceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="verified" stroke="#667eea" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {riskData.length > 0 && (
        <div className="chart-container">
          <h2>Risk Score Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#764ba2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="logs-container">
        <h2>Recent Compliance Logs</h2>
        <table className="logs-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Risk Score</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 10).map((log, index) => (
              <tr key={index}>
                <td>{log.user ? `${log.user.substring(0, 8)}...${log.user.substring(log.user.length - 8)}` : 'N/A'}</td>
                <td>{log.action || 'N/A'}</td>
                <td>{log.risk_score || 0}/5</td>
                <td>
                  <span className={`badge ${log.verified ? 'badge-success' : 'badge-danger'}`}>
                    {log.verified ? 'Verified' : 'Failed'}
                  </span>
                </td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {violations.length > 0 && (
        <div className="logs-container">
          <h2>Recent Violations</h2>
          <table className="logs-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Reason</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {violations.slice(0, 10).map((violation, index) => (
                <tr key={index}>
                  <td>{violation.user ? `${violation.user.substring(0, 8)}...${violation.user.substring(violation.user.length - 8)}` : 'N/A'}</td>
                  <td>{violation.reason || 'Policy violation'}</td>
                  <td>{new Date(violation.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

