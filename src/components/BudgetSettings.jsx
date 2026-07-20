import React, { useState } from 'react';
import useBudgetStore from '../store/useBudgetStore';

export default function BudgetSettings() {
  const { expectedBudgets, addExpectedBudget, deleteExpectedBudget, renameExpectedBudget, requireDeleteConfirm, setRequireDeleteConfirm } = useBudgetStore();
  
  // Get all types (e.g. INCOME, EXPENSE, BILL, etc.)
  const budgetTypes = Object.keys(expectedBudgets);
  const [activeTab, setActiveTab] = useState(budgetTypes[1] || 'EXPENSE');

  // State to manage the new category being added
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');

  // State for inline editing
  const [editingKey, setEditingKey] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    // Prevent duplicates
    if (Object.keys(expectedBudgets[activeTab]).includes(newCategoryName.trim())) {
      alert('Category already exists!');
      return;
    }

    addExpectedBudget(activeTab, newCategoryName.trim(), parseFloat(newCategoryAmount) || 0);
    setNewCategoryName('');
    setNewCategoryAmount('');
  };

  const handleDelete = (categoryName) => {
    if (requireDeleteConfirm) {
      if (!window.confirm(`Are you sure you want to delete the "${categoryName}" category? Past transactions will remain but won't be mapped to a budget.`)) return;
    }
    deleteExpectedBudget(activeTab, categoryName);
  };

  const startEditing = (categoryName, amount) => {
    setEditingKey(categoryName);
    setEditName(categoryName);
    setEditAmount(amount);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;

    if (editName.trim() !== editingKey && Object.keys(expectedBudgets[activeTab]).includes(editName.trim())) {
      alert('A category with this name already exists!');
      return;
    }

    renameExpectedBudget(activeTab, editingKey, editName.trim(), parseFloat(editAmount) || 0);
    setEditingKey(null);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Budget Settings</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {budgetTypes.map(type => (
          <button 
            key={type}
            className={`btn ${activeTab === type ? 'btn-primary' : ''}`}
            style={{ 
              background: activeTab === type ? '' : 'rgba(255,255,255,0.05)',
              color: activeTab === type ? 'white' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab(type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>App Preferences</h3>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1', minWidth: '250px' }}>
            <label>Delete Confirmation</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, marginTop: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={requireDeleteConfirm} 
                onChange={(e) => setRequireDeleteConfirm(e.target.checked)}
                style={{ width: 'auto', margin: 0 }}
              />
              <span style={{ fontWeight: 'normal', color: 'var(--text-primary)' }}>Require "Yes/No" prompt before deleting transactions</span>
            </label>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{activeTab} Categories</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {Object.entries(expectedBudgets[activeTab] || {}).map(([category, amount]) => (
            <div key={category} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px', flexWrap: 'wrap' }}>
              {editingKey === category ? (
                <>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ flex: 2, minWidth: '150px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'white' }}
                  />
                  <div style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                    <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>₱</span>
                    <input 
                      type="number" 
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      style={{ border: 'none', background: 'transparent', width: '100%', paddingLeft: 0 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={saveEdit} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Save</button>
                    <button onClick={() => setEditingKey(null)} className="btn" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 2, minWidth: '150px', fontWeight: '500' }}>{category}</div>
                  <div style={{ flex: 1, minWidth: '120px', color: 'var(--accent-secondary)' }}>₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => startEditing(category, amount)}
                      style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                      title="Edit Category"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(category)}
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                      title="Delete Category"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add New Category Row */}
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed #3b82f6', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '1rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="New Category Name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
              style={{ flex: 2, minWidth: '150px', padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.3)', background: 'var(--input-bg)', color: 'white' }}
            />
            <div style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.3)' }}>
              <span style={{ padding: '0.5rem', color: 'var(--text-secondary)' }}>₱</span>
              <input 
                type="number" 
                placeholder="0.00"
                value={newCategoryAmount}
                onChange={(e) => setNewCategoryAmount(e.target.value)}
                required
                style={{ border: 'none', background: 'transparent', width: '100%', paddingLeft: 0 }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1.5rem', whiteSpace: 'nowrap' }}>+ Add</button>
          </form>
        </div>
      </div>
    </div>
  );
}
