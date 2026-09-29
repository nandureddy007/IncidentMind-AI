import React, { useEffect, useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Database,
  Flame,
  Layers,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const PRESET_CHAOS_SCENARIOS = [
  {
    service: 'Payment API',
    severity: 'critical',
    environment: 'production',
    error: 'Database connection timeout: pool exhausted under high transaction throughput (Active: 100/100 connections)',
  },
  {
    service: 'Auth Service',
    severity: 'high',
    environment: 'production',
    error: 'JWT validation latency spike and intermittent HTTP 503: public signing key expired after rotation',
  },
  {
    service: 'Inventory API',
    severity: 'medium',
    environment: 'staging',
    error: 'Redis connection refused: Error connecting to redis-cluster:6379 during cluster rollover',
  },
  {
    service: 'Notification Gateway',
    severity: 'high',
    environment: 'production',
    error: 'Kafka consumer lag spike > 450,000 msgs: Worker memory leak leading to crashloop backoff',
  },
];

export default function App() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [form, setForm] = useState({
    service: '',
    severity: 'critical',
    environment: 'production',
    error: '',
  });

  const [resolve, setResolve] = useState({
    root_cause: '',
    resolution: '',
  });

  async function load() {
    try {
      const res = await fetch(`${API}/incidents`);
      if (!res.ok) throw new Error('API unreachable');
      const data = await res.json();
      setItems(data);
      if (!selected && data.length > 0) {
        setSelected(data[0].id);
      }
    } catch {
      setNotice('Cannot reach backend. Make sure http://127.0.0.1:8000 is running.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Filtered incidents
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.error.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [items, searchQuery, severityFilter, statusFilter]);

  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`${API}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Creation failed');
      await load();
      setSelected(data.id);
      setAnalysis(null);
      setShowModal(false);
      setNotice(`Incident #${data.id} created.`);
      setForm({ service: '', severity: 'critical', environment: 'production', error: '' });
      triggerSimpleAnalysis(data.id);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  function injectScenario(preset) {
    setForm(preset);
  }

  async function triggerSimpleAnalysis(id) {
    setSelected(id);
    setBusy(true);
    setAnalysis(null);

    setAnalyzingStage('Parsing error symptoms...');
    await new Promise((r) => setTimeout(r, 350));
    setAnalyzingStage('Searching historical memory...');
    await new Promise((r) => setTimeout(r, 450));
    setAnalyzingStage('Generating root-cause hypothesis...');
    await new Promise((r) => setTimeout(r, 400));

    try {
      const res = await fetch(`${API}/incidents/${id}/analyze`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setAnalysis(data);
      setResolve({
        root_cause: data.possible_root_cause || '',
        resolution: data.recommended_actions?.[0] || '',
      });
      setNotice(`Analysis complete with ${Math.round(data.confidence * 100)}% confidence.`);
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
      setAnalyzingStage(null);
    }
  }

  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`${API}/incidents/${selected}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolve),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Save failed');
      setNotice('✓ Postmortem saved to institutional memory.');
      setAnalysis(null);
      await load();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  function copyRunbook() {
    if (!analysis) return;
    const text = `Incident: ${current?.service} (${current?.environment})\nRoot Cause: ${analysis.possible_root_cause}\nConfidence: ${Math.round(analysis.confidence * 100)}%\n\nActions:\n${analysis.recommended_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nNote: ${analysis.safety_note}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const current = items.find((x) => x.id === selected);
  const openCount = items.filter((x) => x.status === 'open').length;
  const resolvedCount = items.filter((x) => x.status === 'resolved').length;

  return (
    <div className="layout">
      {/* Clean Top Navigation */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>
          <div className="brand-info">
            <span className="brand-name">IncidentMind AI</span>
            <span className="brand-tag">Incident Response & Postmortem Memory</span>
          </div>
        </div>

        {/* Clean Stats Overview */}
        <div className="nav-stats">
          <div className="nav-stat-item">
            <span className="stat-label">Active Incidents</span>
            <span className={`stat-value ${openCount > 0 ? 'text-amber' : 'text-emerald'}`}>
              {openCount} Open
            </span>
          </div>
          <div className="nav-stat-item">
            <span className="stat-label">Learned Postmortems</span>
            <span className="stat-value text-blue">{resolvedCount} in Memory</span>
          </div>
          <div className="nav-stat-item">
            <span className="stat-label">Engine Status</span>
            <span className="stat-value text-emerald">
              <span className="status-dot" /> Connected
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Report Incident
          </button>
          <button className="btn btn-icon" title="Refresh data" onClick={load}>
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* Clean Notification Banner */}
      {notice && (
        <div className="alert-bar" onClick={() => setNotice('')}>
          <div className="alert-text">
            <Zap size={15} className="text-blue" />
            <span>{notice}</span>
          </div>
          <button className="btn-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Two-Column View */}
      <main className="main-content">
        {/* Left Column: Incidents List */}
        <section className="column-left">
          <div className="card-header">
            <div className="card-title">
              <Terminal size={16} />
              <h2>Incidents Stream</h2>
            </div>
            <span className="item-count">{filteredItems.length} incidents</span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="toolbar">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Filter by service or error..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="btn-clear" onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="filter-tabs">
              <button
                className={`tab ${severityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSeverityFilter('all')}
              >
                All
              </button>
              <button
                className={`tab ${severityFilter === 'critical' ? 'active' : ''}`}
                onClick={() => setSeverityFilter('critical')}
              >
                Critical
              </button>
              <button
                className={`tab ${severityFilter === 'high' ? 'active' : ''}`}
                onClick={() => setSeverityFilter('high')}
              >
                High
              </button>
              <button
                className={`tab ${statusFilter === 'open' ? 'active' : ''}`}
                onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
              >
                {statusFilter === 'open' ? '● Open only' : 'Open'}
              </button>
            </div>
          </div>

          {/* Incidents Feed */}
          <div className="incident-list">
            {filteredItems.map((item) => {
              const isSelected = selected === item.id;
              return (
                <div
                  key={item.id}
                  className={`incident-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelected(item.id);
                    setAnalysis(null);
                  }}
                >
                  <div className="incident-top">
                    <div className="badge-row">
                      <span className={`badge badge-${item.severity}`}>{item.severity}</span>
                      <span className={`badge badge-status-${item.status}`}>
                        {item.status === 'open' ? 'Open' : 'Resolved'}
                      </span>
                      <span className="env-label">{item.environment}</span>
                    </div>
                    <span className="timestamp">
                      <Clock size={11} />
                      {new Date(item.created_at + (item.created_at.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="service-row">
                    <Server size={14} className="text-muted" />
                    <strong>{item.service}</strong>
                    <span className="incident-id">#{item.id}</span>
                  </div>

                  <p className="error-snippet">{item.error}</p>

                  <div className="incident-bottom">
                    <span className="status-hint">
                      {item.status === 'resolved' ? (
                        <span className="text-emerald">✓ Saved in Memory</span>
                      ) : (
                        <span className="text-muted">Awaiting Investigation</span>
                      )}
                    </span>
                    <button
                      className="btn btn-sm btn-analyze"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSimpleAnalysis(item.id);
                      }}
                    >
                      <Sparkles size={12} />
                      <span>{busy && isSelected ? 'Analyzing...' : 'Analyze'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {!filteredItems.length && (
              <div className="empty-state">
                <p>No incidents match the search criteria.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: AI Analysis Pane */}
        <section className="column-right">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={16} />
              <h2>AI Investigation & Memory Recall</h2>
            </div>
            <span className="badge badge-ai">Memory-Grounded</span>
          </div>

          <div className="analysis-container">
            {/* Step-by-step progress */}
            {analyzingStage && (
              <div className="scanning-view">
                <div className="spinner" />
                <h3>{analyzingStage}</h3>
                <p className="text-muted">Comparing against institutional postmortem history...</p>
              </div>
            )}

            {/* Analysis Results View */}
            {!analyzingStage && analysis && (
              <div className="analysis-results">
                {/* Summary */}
                <div className="summary-card">
                  <div className="section-label">Incident Summary</div>
                  <div className="summary-title">{analysis.summary}</div>
                </div>

                {/* Root Cause Hypothesis */}
                <div className="cause-card">
                  <div className="cause-header">
                    <span className="section-label">Proposed Root Cause</span>
                    <span className="confidence-tag">
                      {Math.round(analysis.confidence * 100)}% Confidence
                    </span>
                  </div>
                  <h3>{analysis.possible_root_cause}</h3>
                  <div className="progress-bar-wrap">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.round(analysis.confidence * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Historical Memories */}
                <div className="memories-wrap">
                  <div className="sub-title">
                    <Database size={14} />
                    <span>Past Incident Matches ({analysis.similar_incidents.length})</span>
                  </div>

                  {analysis.similar_incidents.length > 0 ? (
                    <div className="memories-grid">
                      {analysis.similar_incidents.map((m) => (
                        <div className="memory-item" key={m.id}>
                          <div className="memory-head">
                            <strong>{m.service} (Incident #{m.id})</strong>
                            <span className="similarity-pill">{m.similarity}% Match</span>
                          </div>
                          <div className="memory-detail">
                            <span className="detail-label">Past Cause:</span>
                            <span>{m.root_cause}</span>
                          </div>
                          <div className="memory-detail highlight">
                            <span className="detail-label">Past Fix:</span>
                            <span>{m.resolution}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-matches">
                      No matching historical incident found. Recommendations are based on general diagnostic rules.
                    </p>
                  )}
                </div>

                {/* Diagnostic Runbook */}
                <div className="runbook-wrap">
                  <div className="runbook-header">
                    <div className="sub-title">
                      <CheckCircle2 size={14} className="text-emerald" />
                      <span>Recommended Diagnostic Runbook</span>
                    </div>
                    <button className="btn btn-sm btn-secondary" onClick={copyRunbook}>
                      {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy Runbook'}</span>
                    </button>
                  </div>

                  <ol className="action-list">
                    {analysis.recommended_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ol>

                  <div className="safety-box">
                    <AlertTriangle size={14} className="text-amber flex-shrink-0" />
                    <span>{analysis.safety_note}</span>
                  </div>
                </div>

                {/* Postmortem Form */}
                <div className="resolve-box">
                  <div className="sub-title">
                    <Layers size={14} />
                    <span>Save Postmortem to Memory</span>
                  </div>
                  <p className="resolve-desc">
                    Confirming the root cause and fix will save this incident to institutional memory so future on-call engineers can recall it.
                  </p>

                  <div className="form-stack">
                    <label>
                      <span>Confirmed Root Cause</span>
                      <input
                        value={resolve.root_cause}
                        onChange={(e) => setResolve({ ...resolve, root_cause: e.target.value })}
                        placeholder="What actually caused the issue..."
                      />
                    </label>

                    <label>
                      <span>Resolution / Fix Applied</span>
                      <textarea
                        rows={3}
                        value={resolve.resolution}
                        onChange={(e) => setResolve({ ...resolve, resolution: e.target.value })}
                        placeholder="What steps or commands resolved the issue..."
                      />
                    </label>
                  </div>

                  <button className="btn btn-primary full-width" disabled={busy} onClick={save}>
                    <CheckCircle2 size={15} />
                    <span>{busy ? 'Saving...' : '✓ Resolve & Remember Postmortem'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Empty / Initial State */}
            {!analyzingStage && !analysis && (
              <div className="placeholder-state">
                <div className="placeholder-icon">
                  <Cpu size={32} />
                </div>
                <h3>Select an Incident to Investigate</h3>
                <p>
                  IncidentMind AI will compare the error symptoms with past resolved postmortems and recommend diagnostic steps.
                </p>

                <div className="steps-row">
                  <div className="step-card">
                    <span className="step-num">1</span>
                    <strong>Symptom Search</strong>
                    <p>Scans errors against past incident database.</p>
                  </div>
                  <div className="step-card">
                    <span className="step-num">2</span>
                    <strong>Hypothesis</strong>
                    <p>Calculates confidence and surfaces matching fixes.</p>
                  </div>
                  <div className="step-card">
                    <span className="step-num">3</span>
                    <strong>Save & Learn</strong>
                    <p>Retains the postmortem for future outages.</p>
                  </div>
                </div>

                {current && (
                  <button
                    className="btn btn-primary btn-large"
                    onClick={() => triggerSimpleAnalysis(current.id)}
                  >
                    <Play size={15} />
                    <span>Analyze Incident #{current.id}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Simple Clean Report Incident Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Report New Incident</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            {/* 1-Click Demo Presets */}
            <div className="preset-container">
              <span className="preset-title">
                <Flame size={12} className="text-amber" /> Quick Hackathon Presets:
              </span>
              <div className="preset-buttons">
                {PRESET_CHAOS_SCENARIOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn-preset"
                    onClick={() => injectScenario(preset)}
                  >
                    {preset.service} ({preset.severity})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={create}>
              <div className="modal-form-grid">
                <div className="field-group">
                  <label>Service Name</label>
                  <input
                    required
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    placeholder="e.g. Payment API"
                  />
                </div>

                <div className="field-group">
                  <label>Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                  >
                    <option value="critical">Critical (P1)</option>
                    <option value="high">High (P2)</option>
                    <option value="medium">Medium (P3)</option>
                    <option value="low">Low (P4)</option>
                  </select>
                </div>

                <div className="field-group">
                  <label>Environment</label>
                  <select
                    value={form.environment}
                    onChange={(e) => setForm({ ...form, environment: e.target.value })}
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>

                <div className="field-group span-all">
                  <label>Error Message or Symptoms</label>
                  <textarea
                    required
                    rows={4}
                    value={form.error}
                    onChange={(e) => setForm({ ...form, error: e.target.value })}
                    placeholder="Paste stack traces, timeout logs, or observed errors..."
                  />
                </div>
              </div>

              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Creating...' : 'Create & Analyze'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
