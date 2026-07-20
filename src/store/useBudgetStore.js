import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { INITIAL_EXPECTED_BUDGET, INITIAL_TRANSACTIONS, INITIAL_DEBT_LIST } from '../utils/constants';

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

const useBudgetStore = create(
  persist(
    (set, get) => {
      const setAndSync = (updater) => {
        set(updater);
        const state = get();
        if (state.uid && !state.isReceivingCloudUpdate) {
          const docRef = doc(db, 'users', state.uid);
          setDoc(docRef, {
            transactions: state.transactions,
            expectedBudgets: state.expectedBudgets,
            debtList: state.debtList,
            requireDeleteConfirm: state.requireDeleteConfirm
          }, { merge: true });
        }
      };

      return {
        uid: null,
        syncUnsubscribe: null,
        isReceivingCloudUpdate: false,

        transactions: INITIAL_TRANSACTIONS,
        expectedBudgets: INITIAL_EXPECTED_BUDGET,
        debtList: INITIAL_DEBT_LIST,
        requireDeleteConfirm: true,

        initializeSync: (uid) => {
          if (get().syncUnsubscribe) return;
          const docRef = doc(db, 'users', uid);
          
          getDoc(docRef).then(docSnap => {
            if (!docSnap.exists()) {
              // Migration: Upload local data to empty cloud
              set({ uid });
              setAndSync({ uid }); // Force sync
            } else {
              // Download cloud data
              set({ ...docSnap.data(), uid });
            }
            
            const unsubscribe = onSnapshot(docRef, (snapshot) => {
              if (snapshot.exists() && !snapshot.metadata.hasPendingWrites) {
                set({ isReceivingCloudUpdate: true });
                set(snapshot.data());
                set({ isReceivingCloudUpdate: false });
              }
            });
            
            set({ syncUnsubscribe: unsubscribe, uid });
          });
        },

        setRequireDeleteConfirm: (val) => setAndSync({ requireDeleteConfirm: val }),
        
        addDebtPlan: (person, debtName, totalAmount, totalInstallments, startYearMonthInput) => setAndSync((state) => {
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

        removeDebtMonth: (person, monthIndex) => setAndSync((state) => {
          const updatedPersonList = [...state.debtList[person]];
          updatedPersonList.splice(monthIndex, 1);
          return {
            debtList: {
              ...state.debtList,
              [person]: updatedPersonList
            }
          };
        }),

        addDebtMonth: (person) => setAndSync((state) => {
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

        addTransaction: (transaction) => setAndSync((state) => ({
          transactions: [
            { ...transaction, id: crypto.randomUUID(), date: new Date().toISOString() },
            ...state.transactions
          ]
        })),

        deleteTransaction: (id) => setAndSync((state) => ({
          transactions: state.transactions.filter(t => t.id !== id)
        })),

        addExpectedBudget: (type, name, amount) => setAndSync((state) => ({
          expectedBudgets: {
            ...state.expectedBudgets,
            [type]: {
              ...state.expectedBudgets[type],
              [name]: amount
            }
          }
        })),

        deleteExpectedBudget: (type, name) => setAndSync((state) => {
          const updatedType = { ...state.expectedBudgets[type] };
          delete updatedType[name];
          return {
            expectedBudgets: {
              ...state.expectedBudgets,
              [type]: updatedType
            }
          };
        }),

        renameExpectedBudget: (type, oldName, newName, newAmount) => setAndSync((state) => {
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
          const totals = { INCOME: 0, EXPENSE: 0, BILL: 0, DEBT: 0, SAVINGS: 0, INVESTMENT: 0 };
          state.transactions.forEach(t => {
            if (totals[t.type] !== undefined) {
              totals[t.type] += parseFloat(t.amount || 0);
            }
          });
          return totals;
        },

        getExpectedTotals: () => {
          const state = get();
          const totals = { INCOME: 0, EXPENSE: 0, BILL: 0, DEBT: 0, SAVINGS: 0, INVESTMENT: 0 };
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
      };
    },
    {
      name: 'budget-storage-v5',
      partialize: (state) => ({ 
        transactions: state.transactions,
        expectedBudgets: state.expectedBudgets,
        debtList: state.debtList,
        requireDeleteConfirm: state.requireDeleteConfirm
      }) // Only persist these fields to local storage
    }
  )
);

export default useBudgetStore;
