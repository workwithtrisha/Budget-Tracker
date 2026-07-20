import React, { useState, useRef } from 'react';
import useBudgetStore from '../store/useBudgetStore';
import Tesseract from 'tesseract.js';

export default function TransactionForm({ onClose }) {
  const { addTransaction, expectedBudgets } = useBudgetStore();
  const types = Object.keys(expectedBudgets);
  
  const [formData, setFormData] = useState({
    type: 'EXPENSE',
    category: Object.keys(expectedBudgets.EXPENSE || {})[0] || '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    if (isListening) return; // Prevent multiple instances

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input. Please try Chrome, Safari, or Edge.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    
    let handled = false;
    recognition.onresult = (event) => {
      if (handled) return;
      handled = true;
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({
        ...prev,
        description: prev.description ? `${prev.description} ${transcript}` : transcript
      }));
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      let extractedAmount = 0;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const totalLine = lines.find(l => l.toLowerCase().includes('total'));
      if (totalLine) {
         const priceMatch = totalLine.match(/\b\d+(?:,\d{3})*\.\d{2}\b/);
         if (priceMatch) {
            extractedAmount = parseFloat(priceMatch[0].replace(/,/g, ''));
         }
      }

      if (extractedAmount === 0) {
        const prices = text.match(/\b\d+(?:,\d{3})*\.\d{2}\b/g);
        if (prices) {
          extractedAmount = Math.max(...prices.map(p => parseFloat(p.replace(/,/g, ''))));
        }
      }

      const merchant = lines.length > 0 ? lines[0] : '';
      
      setFormData(prev => ({
        ...prev,
        amount: extractedAmount > 0 ? extractedAmount : prev.amount,
        description: merchant || prev.description
      }));

    } catch (err) {
      console.error(err);
      alert('Failed to scan receipt. Please enter manually.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // When type changes, reset category to first item of new type
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        category: Object.keys(expectedBudgets[value] || {})[0] || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount)) return;

    addTransaction({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Add Transaction</h2>
          <button 
            type="button" 
            onClick={() => fileInputRef.current.click()}
            className="btn"
            disabled={isScanning}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.5rem 1rem', cursor: isScanning ? 'wait' : 'pointer', opacity: isScanning ? 0.7 : 1 }}
          >
            {isScanning ? '⏳ Scanning Text...' : '📷 Scan Receipt'}
          </button>
          <input 
             type="file" 
             accept="image/*" 
             capture="environment" 
             ref={fileInputRef} 
             style={{ display: 'none' }} 
             onChange={handleScan} 
          />
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                {Object.keys(expectedBudgets[formData.type] || {}).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Amount (PHP)</label>
            <input 
              type="number" 
              name="amount" 
              step="0.01" 
              min="0"
              value={formData.amount} 
              onChange={handleChange} 
              placeholder="e.g. 500" 
              required 
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="e.g. Groceries at SM" 
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                onClick={startListening}
                disabled={isListening}
                title="Dictate Description"
                style={{
                  background: isListening ? 'var(--danger)' : 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: isListening ? 'white' : 'var(--text-primary)',
                  padding: '0 1rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: isListening ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s, color 0.2s',
                  fontSize: '1.25rem',
                  opacity: isListening ? 0.8 : 1
                }}
              >
                {isListening ? '🛑' : '🎤'}
              </button>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button type="button" className="btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
