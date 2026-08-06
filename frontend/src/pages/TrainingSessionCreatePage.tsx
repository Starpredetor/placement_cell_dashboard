import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';

import { trainingAPI } from '../services/api';

const TrainingSessionCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<'BOTH' | 'MS' | 'AS'>('BOTH');
  const [batch, setBatch] = useState('Batch 1');
  const [saving, setSaving] = useState(false);

  // Fetch batches to populate dropdown
  const batchesQuery = useQuery(
    ['training-batches-list-create-page'],
    async () => {
      const response = await trainingAPI.batches();
      return response.data?.results || [];
    }
  );

  const batches = batchesQuery.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Please enter a session title.');
      return;
    }

    setSaving(true);
    try {
      await trainingAPI.createLecture({
        program_id: 1, // Default program id
        title,
        date,
        session_type: sessionType,
        batch
      });
      alert(`Session "${title}" created successfully for ${batch}!`);
      navigate('/training');
    } catch (err) {
      console.error(err);
      alert('Unable to save training session.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-lg)', justifyItems: 'center' }}>
      <section className="page-header" style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ width: '100%' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ marginBottom: '12px', padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => navigate('/training')}
          >
            ← Back to Training Sessions Board
          </button>
          <h1 style={{ textAlign: 'left' }}>Create Training Session</h1>
          <p className="text-secondary" style={{ textAlign: 'left' }}>Schedule a new daily training lecture and assign it directly to a division batch.</p>
        </div>
      </section>

      <article className="card" style={{ width: '100%', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <label className="form-group">
            Session Title
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Syllogisms Bootcamp & Practice" 
              required
            />
          </label>

          <label className="form-group">
            Target Batch
            <select value={batch} onChange={e => setBatch(e.target.value)} required>
              {batches.map((b: any) => (
                <option key={b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="form-group">
            Schedule Date
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required
            />
          </label>

          <label className="form-group">
            Session Slot Mode
            <select value={sessionType} onChange={e => setSessionType(e.target.value as any)} required>
              <option value="BOTH">Both (Morning & Afternoon)</option>
              <option value="MS">Morning (MS) only</option>
              <option value="AS">Afternoon (AS) only</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <button type="button" className="btn-secondary" onClick={() => navigate('/training')}>Cancel</button>
            <button type="submit" className="btn-success" disabled={saving}>
              {saving ? 'Creating Session...' : 'Create Session'}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
};

export default TrainingSessionCreatePage;
