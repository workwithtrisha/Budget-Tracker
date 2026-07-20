import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const getNextMonth = (str) => {
  const [m, y] = str.split(' ');
  let d = new Date(parseInt(y), MONTH_NAMES.indexOf(m), 1);
  d.setMonth(d.getMonth() + 1);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

const formatInputMonth = (inputStr) => {
  const [y, m] = inputStr.split('-');
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
};

const toCamelCase = (str) => {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/[^a-zA-Z0-9]/g, '');
};
import { INITIAL_EXPECTED_BUDGET, INITIAL_TRANSACTIONS, INITIAL_DEBT_LIST } from '../utils/constants';

const useBudgetStore = create(
  persist(
    (set, get) => ({
      transactions: INITIAL_TRANSACTIONS,
      expectedBudgets: INITIAL_EXPECTED_BUDGET,
      debtList: INITIAL_DEBT_LIST,
      requireDeleteConfirm: true,

      setRequireDeleteConfirm: (val) => set({ requireDeleteConfirm: val }),
      
      addDebtPlan: (person, debtName, totalAmount, totalInstallments, startYearMonthInput) => set((state) => {
        const startMonthStr = formatInputMonth(startYearMonthInput);
        const monthlyAmount = totalAmount / totalInstallments;
        const camelKey = toCamelCase(debtName);

        const updatedList = [...state.debtList[person]];
        
        if (updatedList.length === 0) {
          updatedList.push({ month: startMonthStr, total: 0 });
        }

        let lastMonthInList = updatedList[updatedList.length - 1].month;
        const dateA = new Date(`${lastMonthInList.split(' ')[0]} 1, ${lastMonthInList.split(' ')[1]}`);
        const dateB = new Date(`${startMonthStr.split(' ')[0]} 1, ${startMonthStr.split(' ')[1]}`);
        
        let d = lastMonthInList;
        if (dateB > dateA) {
          while (d !== startMonthStr) {
            d = getNextMonth(d);
            if (!updatedList.find(r => r.month === d)) {
              updatedList.push({ month: d, total: 0 });
            }
          }
        }

        let startIndex = updatedList.findIndex(r => r.month === startMonthStr);
        if (startIndex === -1) startIndex = 0;

        for (let i = 0; i < totalInstallments; i++) {
          if (startIndex + i >= updatedList.length) {
            updatedList.push({ month: getNextMonth(updatedList[updatedList.length - 1].month), total: 0 });
          }
          const row = { ...updatedList[startIndex + i] };
          row[camelKey] = { value: monthlyAmount, inst: `${i + 1}/${totalInstallments}` };
          row.total = (row.total || 0) + monthlyAmount;
          updatedList[startIndex + i] = row;
        }

        return {
          debtList: {
            ...state.debtList,
            [person]: updatedList
          }
        };
      }),

      removeDebtMonth: (person, monthIndex) => set((state) => {
        const updatedPersonList = [...state.debtList[person]];
        updatedPersonList.splice(monthIndex, 1);
        return {
          debtList: {
            ...state.debtList,
            [person]: updatedPersonList
          }
        };
      }),

      addDebtMonth: (person) => set((state) => {
        const updatedList = [...state.debtList[person]];
        if (updatedList.length === 0) {
          const now = new Date();
          updatedList.push({ month: `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`, total: 0 });
        } else {
          const lastMonth = updatedList[updatedList.length - 1].month;
          updatedList.push({ month: getNextMonth(lastMonth), total: 0 });
        }
        return {
          debtList: {
            ...state.debtList,
            [person]: updatedList
          }
        };
      }),

      addTransaction: (transaction) => set((state) => ({
        transactions: [
          { ...transaction, id: crypto.randomUUID(), date: new Date().toISOString() },
          ...state.transactions
        ]
      })),

      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(t => t.id !== id)
      })),

      addExpectedBudget: (type, name, amount) => set((state) => ({
        expectedBudgets: {
          ...state.expectedBudgets,
          [type]: {
            ...state.expectedBudgets[type],
            [name]: amount
          }
        }
      })),

      deleteExpectedBudget: (type, name) => set((state) => {
        const updatedType = { ...state.expectedBudgets[type] };
        delete updatedType[name];
        return {
          expectedBudgets: {
            ...state.expectedBudgets,
            [type]: updatedType
          }
        };
      }),

      renameExpectedBudget: (type, oldName, newName, newAmount) => set((state) => {
        const updatedType = { ...state.expectedBudgets[type] };
        delete updatedType[oldName];
        updatedType[newName] = newAmount;

        const updatedTransactions = state.transactions.map(t => {
          if (t.type === type && t.category === oldName) {
            return { ...t, category: newName };
          }
          return t;
        });

        return {
          expectedBudgets: {
            ...state.expectedBudgets,
            [type]: updatedType
          },
          transactions: updatedTransactions
        };
      }),

      getActualTotals: () => {
        const state = get();
        const totals = {
          INCOME: 0,
          EXPENSE: 0,
          BILL: 0,
          DEBT: 0,
          SAVINGS: 0,
          INVESTMENT: 0
        };

        state.transactions.forEach(t => {
          if (totals[t.type] !== undefined) {
            totals[t.type] += parseFloat(t.amount || 0);
          }
        });

        return totals;
      },

      getExpectedTotals: () => {
        const state = get();
        const totals = {
          INCOME: 0,
          EXPENSE: 0,
          BILL: 0,
          DEBT: 0,
          SAVINGS: 0,
          INVESTMENT: 0
        };

        Object.keys(state.expectedBudgets).forEach(type => {
          Object.values(state.expectedBudgets[type]).forEach(amount => {
            totals[type] += parseFloat(amount || 0);
          });
        });

        return totals;
      },
      
      getCategoryActual: (type, category) => {
        const state = get();
        return state.transactions
          .filter(t => t.type === type && t.category === category)
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      }
    }),
    {
      name: 'budget-storage-v5',
    }
  )
);

export default useBudgetStore;
