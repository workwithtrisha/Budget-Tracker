import React, { useState } from 'react';
import useBudgetStore from '../store/useBudgetStore';

export default function AddDebtModal({ isOpen, onClose }) {
  const { addDebtPlan } = useBudgetStore();
  const [person, setPerson] = useState('trisha');
  const [debtName, setDebtName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [startYearMonth, setStartYearMonth] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!debtName || !totalAmount || !totalInstallments || !startYearMonth) return;
    
    addDebtPlan(person, debtName, parseFloat(totalAmount), parseInt(totalInstallments, 10), startYearMonth);
    
    setDebtName('');
    setTotalAmount('');
    setTotalInstallments('');
    setStartYearMonth('');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Add New Debt Plan</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="form-group">
            <label>Assignee</label>
            <select value={person} onChange={(e) => setPerson(e.target.value)} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--input-bg)', color: 'var(--text-primary)', width: '100%' }}>
              <option value="trisha">Trisha</option>
              <option value="darelle">Darelle</option>
            </select>
          </div>

          <div className="form-group">
            <label>Debt Name (e.g. "Japan Trip")</label>
            <input type="text" value={debtName} onChange={(e) => setDebtName(e.target.value)} required style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--input-bg)', color: 'var(--text-primary)', width: '100%' }} />
          </div>

          <div className="form-group">
            <label>Total Amount (₱)</label>
            <input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--input-bg)', color: 'var(--text-primary)', width: '100%' }} />
          </div>

          <div className="form-group">
            <label>Number of Installments (Months)</label>
            <input type="number" min="1" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} required style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--input-bg)', color: 'var(--text-primary)', width: '100%' }} />
          </div>

          <div className="form-group">
            <label>Start Month (Pay Later Support)</label>
            <input type="month" value={startYearMonth} onChange={(e) => setStartYearMonth(e.target.value)} required style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--input-bg)', color: 'var(--text-primary)', width: '100%' }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Plan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
