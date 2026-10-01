import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Leaf,
  TestTube,
  CheckCircle2,
  Droplets,
  Info
} from 'lucide-react';

export default function DiagnosticResult({ resultData }) {
  const [activeTab, setActiveTab] = useState('symptoms');

  // No diagnosis yet
  if (!resultData || !resultData.data) {
    return (
      <div
        className="glass-card result-panel"
        style={{
          textAlign: 'center',
          padding: '4rem 2rem'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--bg-canvas-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.2rem auto',
            color: 'var(--accent-terracotta)'
          }}
        >
          <Activity size={32} />
        </div>

        <h3
          style={{
            fontSize: '1.25rem',
            color: 'var(--primary-forest)',
            fontWeight: 700
          }}
        >
          Awaiting Leaf Specimen
        </h3>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            maxWidth: '380px',
            margin: '0.6rem auto 0 auto',
            lineHeight: 1.5
          }}
        >
          Upload a crop leaf photograph or select a sample specimen on the
          left to run deep learning disease classification.
        </p>
      </div>
    );
  }

  const {
    prediction,
    confidence_score,
    inference_mode,
    top_probabilities
  } = resultData.data;

  // Safety defaults in case a field is missing
  const symptoms = Array.isArray(prediction.symptoms)
    ? prediction.symptoms
    : [];

  const organicRemedies = Array.isArray(prediction.organic_remedies)
    ? prediction.organic_remedies
    : [];

  const chemicalTreatments = Array.isArray(prediction.chemical_treatments)
    ? prediction.chemical_treatments
    : [];

  const prevention = Array.isArray(prediction.prevention)
    ? prediction.prevention
    : [];

  const topProbabilities = Array.isArray(top_probabilities)
    ? top_probabilities
    : [];

  return (
    <div className="glass-card result-panel">

      {/* Header Info Card */}
      <div className="result-header-card">
        <div>
          <div className="result-crop-name">
            {prediction.crop_type}
          </div>

          <h2 className="result-disease-name">
            {prediction.display_name}
          </h2>

          {prediction.scientific_name &&
            prediction.scientific_name !== 'N/A' && (
              <div
                style={{
                  fontSize: '0.82rem',
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem'
                }}
              >
                {prediction.scientific_name}
              </div>
            )}

          {/* Severity */}
          <div style={{ marginTop: '0.6rem' }}>
            <span
              className={`severity-pill severity-${String(
                prediction.severity || ''
              ).toLowerCase()}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <AlertTriangle size={13} />
              <span>
                Severity: {prediction.severity}
              </span>
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div className="confidence-ring">
          <div className="confidence-score">
            {confidence_score}%
          </div>

          <div className="confidence-label">
            Confidence
          </div>
        </div>
      </div>

      {/* Probability Breakdown */}
      <div className="predictions-box">
        <div className="predictions-title">
          Model Inference Breakdown ({inference_mode}):
        </div>

        {topProbabilities.map((item, idx) => (
          <div
            key={idx}
            className={`prediction-row ${
              idx === 0 ? 'active' : ''
            }`}
          >
            <span>
              {item.display_name}
            </span>

            <span style={{ fontWeight: 700 }}>
              {item.confidence}%
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-header">

        <button
          type="button"
          className={`tab-btn ${
            activeTab === 'symptoms' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('symptoms')}
        >
          Symptoms
        </button>

        <button
          type="button"
          className={`tab-btn ${
            activeTab === 'organic' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('organic')}
        >
          Organic Remedy
        </button>

        <button
          type="button"
          className={`tab-btn ${
            activeTab === 'chemical' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('chemical')}
        >
          Chemical Control
        </button>

        <button
          type="button"
          className={`tab-btn ${
            activeTab === 'prevention' ? 'active' : ''
          }`}
          onClick={() => setActiveTab('prevention')}
        >
          Agronomy & Care
        </button>

      </div>

      {/* Tab Content */}
      <div className="tab-content">

        {/* ================= SYMPTOMS ================= */}
        {activeTab === 'symptoms' && (
          <div className="treatment-list">

            {prediction.description && (
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.4rem',
                  lineHeight: 1.5
                }}
              >
                {prediction.description}
              </p>
            )}

            {symptoms.map((symptom, idx) => (
              <div
                key={idx}
                className="treatment-item"
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                  aria-hidden="true"
                >
                  <Info size={16} />
                </span>

                <span>
                  {symptom}
                </span>
              </div>
            ))}

          </div>
        )}

        {/* ================= ORGANIC ================= */}
        {activeTab === 'organic' && (
          <div className="treatment-list">

            {organicRemedies.length > 0 ? (
              organicRemedies.map((remedy, idx) => (
                <div
                  key={idx}
                  className="treatment-item organic"
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                    aria-hidden="true"
                  >
                    <Leaf size={16} />
                  </span>

                  <span>
                    {remedy}
                  </span>
                </div>
              ))
            ) : (
              <p>No organic remedy information available.</p>
            )}

          </div>
        )}

        {/* ================= CHEMICAL ================= */}
        {activeTab === 'chemical' && (
          <div className="treatment-list">

            {chemicalTreatments.length > 0 ? (
              chemicalTreatments.map((treatment, idx) => (
                <div
                  key={idx}
                  className="treatment-item chemical"
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                    aria-hidden="true"
                  >
                    <TestTube size={16} />
                  </span>

                  <span>
                    {treatment}
                  </span>
                </div>
              ))
            ) : (
              <p>No chemical treatment information available.</p>
            )}

          </div>
        )}

        {/* ================= PREVENTION ================= */}
        {activeTab === 'prevention' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}
          >

            <div className="treatment-list">

              {prevention.length > 0 ? (
                prevention.map((prev, idx) => (
                  <div
                    key={idx}
                    className="treatment-item prevention"
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                      aria-hidden="true"
                    >
                      <CheckCircle2 size={16} />
                    </span>

                    <span>
                      {prev}
                    </span>
                  </div>
                ))
              ) : (
                <p>No prevention information available.</p>
              )}

            </div>

            {/* Irrigation & NPK */}
            <div
              style={{
                background: 'var(--bg-accent-soft)',
                padding: '1rem 1.2rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-terracotta)',
                fontSize: '0.86rem'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  color: 'var(--accent-terracotta)',
                  fontWeight: 700,
                  marginBottom: '0.3rem'
                }}
              >
                <Droplets size={15} />
                <span>
                  Irrigation & Soil Protocol:
                </span>
              </div>

              <p
                style={{
                  color: 'var(--text-secondary)'
                }}
              >
                {prediction.recommended_irrigation ||
                  'No irrigation information available.'}
              </p>

              <p
                style={{
                  color: 'var(--primary-forest)',
                  marginTop: '0.4rem',
                  fontWeight: 600,
                  fontSize: '0.82rem'
                }}
              >
                🌱 <strong>NPK Guidance:</strong>{' '}
                {prediction.npk_fertilizer_tip ||
                  'No NPK guidance available.'}
              </p>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}