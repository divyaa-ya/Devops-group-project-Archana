import React, { useEffect, useState } from 'react';

export default function ScanHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadScans = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/scans');

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        setScans(data.scans || []);
      } else {
        throw new Error('Could not load scan history');
      }
    } catch (err) {
      console.error('Scan history error:', err);
      setError('Could not load scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  // Hide duplicate-looking scans in the UI.
  // The original records remain safely stored in MongoDB.
  const uniqueScans = [];
  const seen = new Set();

  scans.forEach((scan) => {
    const predictionData = scan.prediction || {};
    const prediction = predictionData.prediction || {};

    const uniqueKey = [
      scan.filename || '',
      prediction.display_name || '',
      prediction.confidence_score || '',
      prediction.severity || '',
    ].join('|');

    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      uniqueScans.push(scan);
    }
  });

  if (loading) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        <h3>Scan History</h3>

        <p style={{ color: 'var(--text-muted)' }}>
          Loading previous scans...
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '1.5rem',
        marginTop: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>
            Scan History
          </h3>

          <p
            style={{
              margin: '0.3rem 0 0',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            Previous plant disease scans
          </p>
        </div>

        <button
          type="button"
          onClick={loadScans}
          style={{
            padding: '0.5rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid var(--border-terracotta)',
            background: 'transparent',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: '#D44333' }}>
          {error}
        </p>
      )}

      {/* No scans */}
      {!error && uniqueScans.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>
          No scans found.
        </p>
      )}

      {/* Scan records */}
      {!error &&
        uniqueScans.map((scan) => {
          const predictionData =
            scan.prediction || {};

          const prediction =
            predictionData.prediction || {};

          return (
            <div
              key={scan._id}
              style={{
                padding: '1rem',
                marginBottom: '0.8rem',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong>
                    {prediction.display_name ||
                      'Unknown diagnosis'}
                  </strong>

                  <div
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      marginTop: '0.25rem',
                    }}
                  >
                    {prediction.crop_type ||
                      'Unknown crop'}
                  </div>
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  {predictionData.confidence_score ??
                    '--'}
                  %
                </div>
              </div>

              <div
                style={{
                  marginTop: '0.6rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                }}
              >
                File:{' '}
                {scan.filename || 'Unknown file'}
              </div>

              <div
                style={{
                  marginTop: '0.3rem',
                  fontSize: '0.82rem',
                }}
              >
                Severity:{' '}
                {prediction.severity || 'Unknown'}
              </div>
            </div>
          );
        })}

      {/* Duplicate information */}
      {scans.length > uniqueScans.length && (
        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          {scans.length - uniqueScans.length} duplicate
          scan record(s) are stored in the database but
          hidden from this view.
        </p>
      )}
    </div>
  );
}