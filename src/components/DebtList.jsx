import React, { useState } from 'react';
import useBudgetStore from '../store/useBudgetStore';
import { formatCurrency } from '../utils/constants';
import AddDebtModal from './AddDebtModal';

export default function DebtList() {
  const { debtList, removeDebtMonth, addDebtMonth } = useBudgetStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCell = (obj) => {
    if (!obj || !obj.value || obj.value <= 0) return '₱0.00';
    let text = formatCurrency(obj.value);
    if (obj.inst) {
      text += ` (${obj.inst})`;
    }
    return text;
  };

  const calculateTotal = (person, key) => {
    return debtList[person].reduce((sum, row) => sum + (row[key]?.value || 0), 0);
  };

  const calculateOverallTotal = (person) => {
    return debtList[person].reduce((sum, row) => sum + (row.total || 0), 0);
  };

  const getColumns = (list) => {
    const cols = new Set();
    list.forEach(row => {
      Object.keys(row).forEach(k => {
        if (k !== 'month' && k !== 'total') cols.add(k);
      });
    });
    return Array.from(cols);
  };

  const formatHeader = (str) => {
    const result = str.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  const renderTable = (person, colorTheme) => {
    const cols = getColumns(debtList[person]);

    return (
      <div className="table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Month</th>
              {cols.map(c => (
                <th key={c} style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', textTransform: 'capitalize' }}>{formatHeader(c)}</th>
              ))}
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>Total Monthly</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {debtList[person].length === 0 && (
              <tr>
                <td colSpan={cols.length + 3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>All months completed!</td>
              </tr>
            )}
            {debtList[person].map((row, idx) => (
              <tr 
                key={row.month} 
                style={{ 
                  background: idx === 0 ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
                  borderLeft: idx === 0 ? '4px solid #ea580c' : '4px solid transparent',
                  boxShadow: idx === 0 ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                <td style={{ padding: '0.75rem', fontWeight: idx === 0 ? '700' : '500', minWidth: '140px' }}>
                  {row.month}
                  {idx === 0 && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#ea580c', color: 'white', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle' }}>PAY NOW</span>}
                </td>
                {cols.map(c => (
                  <td key={c} style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCell(row[c])}</td>
                ))}
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(row.total)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <button 
                    onClick={(e) => {
                      if (idx !== 0) {
                        e.preventDefault();
                        alert("Please finish the previous month's debt first!");
                        return;
                      }
                      removeDebtMonth(person, idx);
                    }}
                    title={idx !== 0 ? "Please finish the previous month's debt first" : "Mark month as paid"}
                    style={{ 
                      background: idx === 0 ? 'var(--success)' : 'rgba(0,0,0,0.1)', 
                      color: idx === 0 ? 'white' : 'var(--text-secondary)', 
                      border: 'none', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      cursor: idx === 0 ? 'pointer' : 'not-allowed', 
                      fontSize: '0.75rem',
                      opacity: idx === 0 ? 1 : 0.5
                    }}
                  >
                    Done
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {debtList[person].length > 0 && (
            <tfoot>
              <tr style={{ background: 'rgba(0,0,0,0.1)', fontWeight: 'bold' }}>
                <td style={{ padding: '0.75rem', textAlign: 'left' }}>Remaining Total</td>
                {cols.map(c => (
                  <td key={c} style={{ padding: '0.75rem', textAlign: 'right' }}>{formatCurrency(calculateTotal(person, c))}</td>
                ))}
                <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--danger)' }}>{formatCurrency(calculateOverallTotal(person))}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => addDebtMonth(person)}
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px dashed rgba(255,255,255,0.3)', 
              color: 'var(--text-primary)', 
              padding: '0.5rem 1rem', 
              borderRadius: 'var(--radius-sm)', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            + Add Next Month Manually
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <AddDebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--danger)' }}>LUNTAO'S DEBT</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--danger)' }}>{formatCurrency(calculateOverallTotal('trisha') + calculateOverallTotal('darelle'))}</h2>
            <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>+ Add Debt Plan</button>
          </div>
        </div>
        
        <h3 style={{ marginBottom: '1rem', background: '#dc2626', display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '4px', color: 'white' }}>Trisha</h3>
        {renderTable('trisha')}
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', background: '#3b82f6', display: 'inline-block', padding: '0.25rem 1rem', borderRadius: '4px', color: 'white' }}>Darelle</h3>
        {renderTable('darelle')}
      </div>
    </div>
  );
}
