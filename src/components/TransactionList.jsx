import React from 'react';
import useBudgetStore from '../store/useBudgetStore';
import { formatCurrency } from '../utils/constants';
import { Trash2, Filter } from 'lucide-react';

export default function TransactionList() {
  const { transactions, deleteTransaction, requireDeleteConfirm } = useBudgetStore();
  const [filterType, setFilterType] = React.useState('ALL');

  const handleDelete = (id) => {
    if (requireDeleteConfirm) {
      if (window.confirm("Are you sure you want to delete this transaction?")) {
        deleteTransaction(id);
      }
    } else {
      deleteTransaction(id);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTransactions = (filterType === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.type === filterType))
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Recent Transactions</h2>
        <div className="flex items-center gap-2">
          <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
            <option value="BILL">Bill</option>
            <option value="DEBT">Debt</option>
            <option value="SAVINGS">Savings</option>
            <option value="INVESTMENT">Investment</option>
          </select>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <p>No transactions found. Click "Add Transaction" to get started.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(t => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>
                    <span className={`badge ${t.type.toLowerCase()}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>{t.category}</td>
                  <td>{t.description || '-'}</td>
                  <td className="text-right" style={{ fontWeight: '600' }}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="text-right">
                    <button 
                      className="btn-icon" 
                      onClick={() => handleDelete(t.id)}
                      title="Delete transaction"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
