import React from 'react';
import useBudgetStore from '../store/useBudgetStore';
import { formatCurrency } from '../utils/constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#818cf8', '#f87171', '#c084fc', '#4ade80'];

const StatCard = ({ title, expected, actual, type, progressColor }) => {
  const percentage = expected > 0 ? (actual / expected) * 100 : 0;
  
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: '700' }}>
          {formatCurrency(actual)}
        </span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          / {formatCurrency(expected)}
        </span>
      </div>
      
      <div className="progress-bg">
        <div 
          className={`progress-fill ${progressColor}`} 
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
        {percentage.toFixed(1)}%
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
        <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{payload[0].name}</p>
        <p style={{ color: payload[0].payload.fill }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { getActualTotals, getExpectedTotals, getCategoryActual, expectedBudgets } = useBudgetStore();
  
  const actuals = getActualTotals();
  const expected = getExpectedTotals();

  // Top spending categories calculation
  const expenseCategories = Object.keys(expectedBudgets.EXPENSE || {});
  const expenseData = expenseCategories.map(cat => ({
    name: cat,
    value: getCategoryActual('EXPENSE', cat),
    expected: expectedBudgets.EXPENSE[cat] || 0
  }))
  .filter(cat => cat.value > 0)
  .sort((a, b) => b.value - a.value);

  const topSpending = expenseData.slice(0, 5);
  const totalLeftover = actuals.INCOME - actuals.EXPENSE - actuals.BILL - actuals.DEBT - actuals.SAVINGS - actuals.INVESTMENT;

  const trishaActual = 
    getCategoryActual('INCOME', "Trisha's Paycheck 1st Week") + 
    getCategoryActual('INCOME', "Trisha's Paycheck 2nd Week") +
    getCategoryActual('INCOME', "Trisha's Paycheck 3rd Week") +
    getCategoryActual('INCOME', "Trisha's Paycheck 4th Week");

  const trishaExpected = 
    (expectedBudgets.INCOME["Trisha's Paycheck 1st Week"] || 0) +
    (expectedBudgets.INCOME["Trisha's Paycheck 2nd Week"] || 0) +
    (expectedBudgets.INCOME["Trisha's Paycheck 3rd Week"] || 0) +
    (expectedBudgets.INCOME["Trisha's Paycheck 4th Week"] || 0);

  const darelleActual = 
    getCategoryActual('INCOME', "Darelle's 1st Pay") +
    getCategoryActual('INCOME', "Darelle's 2nd Pay");

  const darelleExpected = 
    (expectedBudgets.INCOME["Darelle's 1st Pay"] || 0) +
    (expectedBudgets.INCOME["Darelle's 2nd Pay"] || 0);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Overview</h2>
      <div className="dashboard-grid">
        <StatCard 
          title="Total Expenses" 
          expected={expected.EXPENSE} 
          actual={actuals.EXPENSE} 
          progressColor="expense" 
        />
        <StatCard 
          title="Total Bills" 
          expected={expected.BILL} 
          actual={actuals.BILL} 
          progressColor="bill" 
        />
        <StatCard 
          title="Debt Payments" 
          expected={expected.DEBT} 
          actual={actuals.DEBT} 
          progressColor="debt" 
        />
        <StatCard 
          title="Total Savings" 
          expected={expected.SAVINGS} 
          actual={actuals.SAVINGS} 
          progressColor="savings" 
        />
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
           <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Amount Left To Spend
          </h3>
          <span style={{ fontSize: '2rem', fontWeight: '700', color: totalLeftover < 0 ? 'var(--danger)' : 'var(--text-primary)', marginTop: '0.5rem' }}>
            {formatCurrency(totalLeftover)}
          </span>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Income Breakdown</h2>
      <div className="dashboard-grid">
        <StatCard 
          title="Trisha's Income" 
          expected={trishaExpected} 
          actual={trishaActual} 
          progressColor="trisha-income" 
        />
        <StatCard 
          title="Darelle's Income" 
          expected={darelleExpected} 
          actual={darelleActual} 
          progressColor="darelle-income" 
        />
        <StatCard 
          title="Total Income" 
          expected={expected.INCOME} 
          actual={actuals.INCOME} 
          progressColor="income" 
        />
      </div>

      <div className="dashboard-grid dashboard-grid-2" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Expense Breakdown</h2>
          {expenseData.length > 0 ? (
            <div style={{ flex: 1, minHeight: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={72} 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: '20px', fontSize: '0.85rem' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No expense data to display.</p>
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Top 5 Spending Categories</h2>
          {topSpending.length > 0 ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {topSpending.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span style={{ fontWeight: '500' }}>{cat.name}</span>
                    <span style={{ fontWeight: '600', color: 'var(--warning)' }}>{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="progress-bg" style={{ height: '6px' }}>
                    <div 
                      className="progress-fill expense" 
                      style={{ width: `${Math.min(cat.expected > 0 ? (cat.value / cat.expected) * 100 : 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
             </div>
          ) : (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No top spending data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
