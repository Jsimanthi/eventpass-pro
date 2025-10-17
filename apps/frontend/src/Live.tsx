import React, { useMemo, useState } from 'react';
import useWebSocket from './hooks/useWebSocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
    };
  }
}

interface CheckIn {
  email: string;
  gift_claimed_at: string;
}

const Live: React.FC = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const wsUrl = baseUrl.replace('http', 'ws') + '/ws';
  const checkIns = useWebSocket<CheckIn>(wsUrl);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');

  const chartData = useMemo(() => {
    const data: { [key: string]: number } = {};
    checkIns.forEach(checkIn => {
      const time = new Date(checkIn.gift_claimed_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      if (data[time]) {
        data[time]++;
      } else {
        data[time] = 1;
      }
    });
    
    // Sort by time and fill gaps
    const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
    return sortedEntries.map(([time, count]) => ({ time, count }));
  }, [checkIns]);

  const recentCheckIns = useMemo(() => {
    return checkIns.slice(-10).reverse(); // Last 10 check-ins, most recent first
  }, [checkIns]);

  const totalCheckIns = checkIns.length;
  const lastHourCheckIns = useMemo(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return checkIns.filter(checkIn => new Date(checkIn.gift_claimed_at) > oneHourAgo).length;
  }, [checkIns]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis
              dataKey="time"
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)'
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--primary-color)"
              strokeWidth={3}
              dot={{ fill: 'var(--primary-color)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--primary-color)', strokeWidth: 2 }}
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="checkInGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis
              dataKey="time"
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)'
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--primary-color)"
              strokeWidth={2}
              fill="url(#checkInGradient)"
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis
              dataKey="time"
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <YAxis
              stroke="var(--text-secondary)"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)'
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--primary-color)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Live Check-in Dashboard</h1>
          <p className="card-subtitle">Real-time monitoring of event check-ins</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)'
      }}>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              margin: '0 auto var(--space-2)'
            }}>
              📊
            </div>
            <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--primary-color)' }}>
              {totalCheckIns}
            </p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
              Total Check-ins
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--secondary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              margin: '0 auto var(--space-2)'
            }}>
              ⚡
            </div>
            <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--secondary-color)' }}>
              {lastHourCheckIns}
            </p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
              Last Hour
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-size-2xl)',
              margin: '0 auto var(--space-2)'
            }}>
              📈
            </div>
            <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--accent-color)' }}>
              {chartData.length > 0 ? Math.max(...chartData.map(d => d.count)) : 0}
            </p>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
              Peak Rate
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Check-ins Over Time</h2>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {(['line', 'area', 'bar'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`btn btn-sm ${chartType === type ? 'btn-primary' : 'btn-outline'}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card-content">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              {renderChart()}
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <div style={{ fontSize: '3rem' }}>📊</div>
              <p>Waiting for check-in data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Check-ins Feed */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Check-ins</h2>
          <p className="card-subtitle">Latest activity feed</p>
        </div>
        <div className="card-content">
          {recentCheckIns.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {recentCheckIns.map((checkIn, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--gray-50)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--gray-200)',
                    animation: 'slideIn 0.3s ease-out'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--success-color)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-bold)'
                    }}>
                      ✓
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                        {checkIn.email}
                      </p>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        Checked in successfully
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {new Date(checkIn.gift_claimed_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                    <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {new Date(checkIn.gift_claimed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: 'var(--space-8)',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>👥</div>
              <p>No check-ins yet</p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                Check-ins will appear here as they happen
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Live;
