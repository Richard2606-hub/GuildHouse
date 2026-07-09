import React, { useState, useEffect } from 'react';

const DEFAULT_PACK_TEMPLATE = `name: New Pack
version: 1.0.0
description: Short description of this clerk's domain

languages:
  - en

persona:
  voice: Describe the clerk's communication style
  stance: Describe the clerk's approach to answers

rules:
  - Rule 1: What the clerk must always do
  - Rule 2: What the clerk must never do

escalation_policy:
  forbidden:
    - financial_advice
  redact_first:
    - phone_numbers

tools: []
`;

export default function Studio({ packs = [], onPacksChanged }) {
  const [selectedPackId, setSelectedPackId] = useState('');
  const [yamlContent, setYamlContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [filename, setFilename] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isNewPack, setIsNewPack] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load pack source when selected
  useEffect(() => {
    if (!selectedPackId || isNewPack) return;
    setLoading(true);
    fetch(`/api/packs/${selectedPackId}/source`)
      .then(res => {
        if (!res.ok) throw new Error('Pack source not found');
        return res.json();
      })
      .then(data => {
        setYamlContent(data.content);
        setOriginalContent(data.content);
        setFilename(data.filename);
        setStatus({ type: '', message: '' });
      })
      .catch(err => {
        setStatus({ type: 'error', message: err.message });
      })
      .finally(() => setLoading(false));
  }, [selectedPackId, isNewPack]);

  const handleNewPack = () => {
    setIsNewPack(true);
    setSelectedPackId('');
    setYamlContent(DEFAULT_PACK_TEMPLATE);
    setOriginalContent('');
    setFilename('new_pack.yaml');
    setStatus({ type: 'info', message: 'Editing new pack. Fill in the YAML and click Save.' });
  };

  const handleSelectPack = (e) => {
    const id = e.target.value;
    setSelectedPackId(id);
    setIsNewPack(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isNewPack) {
        // Create new pack
        const res = await fetch('/api/packs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, content: yamlContent }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to create pack');
        }
        setStatus({ type: 'success', message: 'Pack created successfully!' });
        setIsNewPack(false);
      } else {
        // Update existing pack
        const res = await fetch(`/api/packs/${selectedPackId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: yamlContent }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Failed to update pack');
        }
        setStatus({ type: 'success', message: 'Pack saved successfully!' });
      }
      setOriginalContent(yamlContent);
      if (onPacksChanged) onPacksChanged();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedPackId) return;
    if (!confirm(`Delete pack "${selectedPackId}"? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/packs/${selectedPackId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete pack');
      setStatus({ type: 'success', message: 'Pack deleted.' });
      setYamlContent('');
      setSelectedPackId('');
      if (onPacksChanged) onPacksChanged();
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    }
    setLoading(false);
  };

  const hasChanges = yamlContent !== originalContent;

  // Parse YAML for preview (simple key extraction)
  const parsePreview = (yaml) => {
    try {
      const lines = yaml.split('\n');
      const result = {};
      let currentKey = '';
      let currentList = [];
      let inList = false;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const keyMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
        if (keyMatch) {
          if (inList && currentKey) {
            result[currentKey] = currentList;
            currentList = [];
          }
          currentKey = keyMatch[1];
          const value = keyMatch[2].trim();
          if (value && value !== '[]') {
            result[currentKey] = value;
            inList = false;
          } else {
            inList = true;
            currentList = [];
          }
        } else if (trimmed.startsWith('- ') && inList) {
          currentList.push(trimmed.slice(2));
        }
      }
      if (inList && currentKey) {
        result[currentKey] = currentList;
      }
      return result;
    } catch {
      return {};
    }
  };

  const preview = parsePreview(yamlContent);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-base)',
    }}>
      {/* Header */}
      <div style={{
        padding: '0 28px',
        height: '60px',
        minHeight: '60px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Pack Studio
          </h2>
          {hasChanges && (
            <span className="badge badge-warning">Unsaved changes</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={isNewPack ? '__new__' : selectedPackId}
            onChange={handleSelectPack}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              borderRadius: 'var(--radius-md)',
              padding: '7px 14px',
              outline: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontWeight: '500',
              minWidth: '180px',
            }}
          >
            <option value="">Select a pack...</option>
            {packs.map(p => (
              <option key={p.name} value={p.name.toLowerCase().replace(/ /g, '_')}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn-ghost" onClick={handleNewPack}>+ New Pack</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading || !yamlContent.trim()}
            style={{ padding: '8px 20px' }}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          {selectedPackId && !isNewPack && (
            <button className="btn-danger" onClick={handleDelete} disabled={loading}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      {status.message && (
        <div style={{
          padding: '10px 28px',
          background: status.type === 'error' ? 'var(--danger-bg)' : status.type === 'success' ? 'var(--success-bg)' : 'var(--info-bg)',
          color: status.type === 'error' ? 'var(--danger)' : status.type === 'success' ? 'var(--success)' : 'var(--info)',
          fontSize: '13px',
          fontWeight: '500',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>{status.message}</span>
          <button
            onClick={() => setStatus({ type: '', message: '' })}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px' }}
          >
            x
          </button>
        </div>
      )}

      {/* Editor + Preview */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
      }}>
        {/* YAML Editor */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            padding: '10px 20px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              YAML EDITOR
            </span>
            {isNewPack && (
              <input
                value={filename}
                onChange={e => setFilename(e.target.value)}
                placeholder="filename.yaml"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  width: '160px',
                }}
              />
            )}
            {!isNewPack && filename && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {filename}
              </span>
            )}
          </div>
          <textarea
            value={yamlContent}
            onChange={e => setYamlContent(e.target.value)}
            spellCheck={false}
            placeholder="Select a pack or create a new one..."
            style={{
              flex: 1,
              background: 'var(--bg-base)',
              color: 'var(--text-primary)',
              border: 'none',
              padding: '20px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              lineHeight: '1.7',
              resize: 'none',
              outline: 'none',
              tabSize: 2,
            }}
          />
        </div>

        {/* Live Preview */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 20px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              LIVE PREVIEW
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {!yamlContent.trim() ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                No YAML content to preview.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name & Description */}
                {preview.name && (
                  <div>
                    <h3 className="gradient-text" style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                      {preview.name}
                    </h3>
                    {preview.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{preview.description}</p>
                    )}
                    {preview.version && (
                      <span className="badge badge-success" style={{ marginTop: '6px' }}>v{preview.version}</span>
                    )}
                  </div>
                )}

                {/* Languages */}
                {Array.isArray(preview.languages) && (
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                      Languages
                    </p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {preview.languages.map(l => (
                        <span key={l} style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--accent-blue)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}>{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {Array.isArray(preview.rules) && preview.rules.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                      Rules ({preview.rules.length})
                    </p>
                    {preview.rules.map((r, i) => (
                      <div key={i} style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        padding: '4px 0 4px 12px',
                        borderLeft: '2px solid var(--accent-indigo)',
                        marginBottom: '4px',
                      }}>
                        {r}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tools */}
                {Array.isArray(preview.tools) && preview.tools.length > 0 && (
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                      Tools
                    </p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      {preview.tools.map(t => (
                        <span key={t} className="badge badge-accent">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw parsed */}
                <div style={{ marginTop: '8px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Parsed Fields
                  </p>
                  <pre style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    color: 'var(--text-secondary)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {JSON.stringify(preview, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
