// Initialize Lucide icons
lucide.createIcons();

// Currency data
const currencies = {
  USD: { symbol: '$', flag: '🇺🇸', rate: 1.00 },
  EUR: { symbol: '€', flag: '🇪🇺', rate: 0.85 },
  GBP: { symbol: '£', flag: '🇬🇧', rate: 0.73 },
  JPY: { symbol: '¥', flag: '🇯🇵', rate: 110.0 },
  AUD: { symbol: 'A$', flag: '🇦🇺', rate: 1.35 },
  CAD: { symbol: 'C$', flag: '🇨🇦', rate: 1.25 },
  CNY: { symbol: '¥', flag: '🇨🇳', rate: 6.45 },
  INR: { symbol: '₹', flag: '🇮🇳', rate: 74.5 }
};

// State
let wallet = {
  balance: 0,
  currency: 'USD',
  transactions: [],
  monthlyBudget: 0,
  currentMonthSpending: 0
};

// DOM Elements
const walletSetup = document.getElementById('walletSetup');
const walletContent = document.getElementById('walletContent');
const initialBalance = document.getElementById('initialBalance');
const initialCurrency = document.getElementById('initialCurrency');
const setupWallet = document.getElementById('setupWallet');
const balanceDisplay = document.getElementById('balanceDisplay');
const amount = document.getElementById('amount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const result = document.getElementById('result');
const convert = document.getElementById('convert');
const transactions = document.getElementById('transactions');
const themeToggle = document.getElementById('themeToggle');
const swapCurrencies = document.getElementById('swapCurrencies');

// Initialize currency selects
function initializeCurrencySelects() {
  const selects = [initialCurrency, fromCurrency, toCurrency];
  const options = Object.entries(currencies).map(([code, { flag, symbol }]) => 
    `<option value="${code}">${flag} ${code} (${symbol})</option>`
  ).join('');
  
  selects.forEach(select => {
    select.innerHTML = options;
  });
}

// Calculator functionality
let calcDisplay = document.getElementById('calcDisplay');

function appendToCalc(value) {
  calcDisplay.value += value;
}

function clearCalc() {
  calcDisplay.value = '';
}

function calculateResult() {
  try {
    calcDisplay.value = eval(calcDisplay.value);
    amount.value = calcDisplay.value;
  } catch {
    calcDisplay.value = 'Error';
  }
}

// Budget tracking
let categories = [
  { name: 'Food', budget: 500, spent: 0 },
  { name: 'Transport', budget: 300, spent: 0 },
  { name: 'Entertainment', budget: 200, spent: 0 }
];

function updateCategories() {
  const container = document.getElementById('categories');
  container.innerHTML = categories.map(cat => {
    const percentSpent = (cat.spent / cat.budget * 100);
    const isOverBudget = percentSpent > 100;
    return `
      <div class="category-item ${isOverBudget ? 'over-budget' : ''}">
        <div>${cat.name}</div>
        <div class="amount">${currencies[wallet.currency].symbol}${cat.spent.toFixed(2)}</div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${Math.min(percentSpent, 100)}%; 
               background: ${isOverBudget ? '#ef4444' : '#3b82f6'}"></div>
        </div>
        <div>Budget: ${currencies[wallet.currency].symbol}${cat.budget}</div>
      </div>
    `;
  }).join('');
}

function addCategory() {
  const name = prompt('Enter category name:');
  const budget = parseFloat(prompt('Enter budget amount:'));
  if (name && !isNaN(budget)) {
    categories.push({ name, budget, spent: 0 });
    updateCategories();
    saveCategories();
    addCategorySelector(); // Refresh category selector
  }
}

function addExpenseToCategory(categoryName, amount) {
  const category = categories.find(c => c.name === categoryName);
  if (category) {
    category.spent += amount;
    if (category.spent > category.budget) {
      showNotification(`Warning: Exceeded budget for ${categoryName}!`);
    }
    updateCategories();
    saveCategories();
  }
}

function addCategorySelector() {
  let categorySelect = document.getElementById('expenseCategory');
  if (!categorySelect) {
    categorySelect = document.createElement('select');
    categorySelect.id = 'expenseCategory';
    const convertButton = document.getElementById('convert');
    convertButton.parentNode.insertBefore(categorySelect, convertButton);
  }
  
  categorySelect.innerHTML = categories.map(cat => 
    `<option value="${cat.name}">${cat.name}</option>`
  ).join('');
}

// Update budget displays
function updateBudgetDisplays() {
  const monthlySpendingElem = document.getElementById('monthlySpending');
  const budgetRemainingElem = document.getElementById('budgetRemaining');
  const symbol = currencies[wallet.currency].symbol;
  
  // Calculate total spending for current month
  const currentDate = new Date();
  const currentMonthSpending = wallet.transactions
    .filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === currentDate.getMonth() &&
             transDate.getFullYear() === currentDate.getFullYear();
    })
    .reduce((total, t) => total + t.amount, 0);

  wallet.currentMonthSpending = currentMonthSpending;
  
  // Update displays
  monthlySpendingElem.textContent = `${symbol}${currentMonthSpending.toFixed(2)}`;
  const remaining = wallet.monthlyBudget - currentMonthSpending;
  budgetRemainingElem.textContent = `${symbol}${remaining.toFixed(2)}`;
  
  // Add warning class if over budget
  budgetRemainingElem.parentElement.classList.toggle('over-budget', remaining < 0);
}

// Voice input
function startVoiceInput() {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const number = transcript.match(/\d+/);
      if (number) {
        amount.value = number[0];
        showNotification('Voice input received!');
      }
    };

    recognition.start();
  }
}

// Charts
function updateCharts() {
  // Spending over time chart
  const ctx1 = document.getElementById('spendingChart').getContext('2d');
  const spendingData = getSpendingData();
  
  new Chart(ctx1, {
    type: 'line',
    data: {
      labels: spendingData.labels,
      datasets: [{
        label: 'Daily Spending',
        data: spendingData.values,
        borderColor: '#3b82f6',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // Category spending chart
  const ctx2 = document.getElementById('categoryChart').getContext('2d');
  new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: categories.map(c => c.name),
      datasets: [{
        data: categories.map(c => c.spent),
        backgroundColor: [
          '#3b82f6',
          '#ef4444',
          '#10b981',
          '#f59e0b',
          '#6366f1'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function getSpendingData() {
  const dates = [];
  const spending = [];
  const last7Days = new Array(7).fill(0).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  last7Days.forEach(date => {
    const daySpending = wallet.transactions
      .filter(t => t.date.toISOString().split('T')[0] === date)
      .reduce((sum, t) => sum + t.amount, 0);
    
    dates.push(new Date(date).toLocaleDateString());
    spending.push(daySpending);
  });

  return {
    labels: dates,
    values: spending
  };
}

// Tab switching
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
  
  document.getElementById('overviewTab').style.display = tab === 'overview' ? 'block' : 'none';
  document.getElementById('budgetTab').style.display = tab === 'budget' ? 'block' : 'none';
  document.getElementById('statsTab').style.display = tab === 'stats' ? 'block' : 'none';

  if (tab === 'stats') {
    updateCharts();
  }
}

// Convert currencies
convert.addEventListener('click', () => {
  const value = parseFloat(amount.value);
  if (isNaN(value) || value <= 0) {
    showNotification('Please enter a valid amount');
    return;
  }

  const from = fromCurrency.value;
  const to = toCurrency.value;
  
  if (from === wallet.currency && value > wallet.balance) {
    showNotification('Insufficient balance');
    return;
  }

  const convertedAmount = value * (currencies[to].rate / currencies[from].rate);
  result.value = convertedAmount.toFixed(2);

  if (from === wallet.currency) {
    // Check if this transaction would exceed monthly budget
    const potentialNewSpending = wallet.currentMonthSpending + value;
    if (potentialNewSpending > wallet.monthlyBudget) {
      showNotification('Warning: This transaction will exceed your monthly budget!');
    }

    wallet.balance -= value;
    const transaction = {
      date: new Date(),
      from,
      to,
      amount: value,
      convertedAmount,
      category: document.getElementById('expenseCategory')?.value
    };
    
    wallet.transactions.unshift(transaction);
    
    if (transaction.category) {
      addExpenseToCategory(transaction.category, value);
    }
    
    updateBalanceDisplay();
    updateTransactionHistory();
    updateBudgetDisplays();
    saveWallet();
  }
});

// Swap currencies
swapCurrencies.addEventListener('click', () => {
  const temp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = temp;
  amount.value = '';
  result.value = '';
});

// Update transaction history
function updateTransactionHistory() {
  transactions.innerHTML = wallet.transactions.map(t => `
    <div class="transaction">
      <div>
        ${currencies[t.from].symbol}${t.amount.toFixed(2)} ${t.from} →
        ${currencies[t.to].symbol}${t.convertedAmount.toFixed(2)} ${t.to}
        ${t.category ? `<span class="transaction-category">${t.category}</span>` : ''}
      </div>
      <div class="transaction-date">${new Date(t.date).toLocaleString()}</div>
    </div>
  `).join('');
}

// Update balance display
function updateBalanceDisplay() {
  const { symbol } = currencies[wallet.currency];
  balanceDisplay.textContent = `Balance: ${symbol}${wallet.balance.toFixed(2)} ${wallet.currency}`;
}

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeToggle.innerHTML = `<i data-lucide="${isDark ? 'sun' : 'moon'}"></i>`;
  lucide.createIcons();
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Notifications
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.add('show');
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Save and load data
function saveWallet() {
  localStorage.setItem('wallet', JSON.stringify(wallet));
}

function saveCategories() {
  localStorage.setItem('categories', JSON.stringify(categories));
}

function loadWallet() {
  const saved = localStorage.getItem('wallet');
  if (saved) {
    wallet = JSON.parse(saved);
    wallet.transactions.forEach(t => t.date = new Date(t.date));
    walletSetup.classList.add('hidden');
    walletContent.classList.remove('hidden');
    updateBalanceDisplay();
    updateTransactionHistory();
    updateBudgetDisplays();
  }

  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.innerHTML = '<i data-lucide="sun"></i>';
    lucide.createIcons();
  }
}

function loadCategories() {
  const saved = localStorage.getItem('categories');
  if (saved) {
    categories = JSON.parse(saved);
    updateCategories();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeCurrencySelects();
  loadWallet();
  loadCategories();
  addCategorySelector();
  lucide.createIcons();
});

// Calculator toggle
document.getElementById('calculatorToggle').addEventListener('click', () => {
  document.getElementById('calculator').classList.toggle('active');
});

// Setup wallet
document.getElementById('setupWallet').addEventListener('click', () => {
  const balance = parseFloat(initialBalance.value);
  const monthlyBudget = parseFloat(document.getElementById('monthlyBudget').value);
  
  if (isNaN(balance) || balance <= 0 || isNaN(monthlyBudget) || monthlyBudget <= 0) {
    showNotification('Please enter valid amounts');
    return;
  }

  wallet.balance = balance;
  wallet.currency = initialCurrency.value;
  wallet.monthlyBudget = monthlyBudget;
  
  walletSetup.classList.add('hidden');
  walletContent.classList.remove('hidden');
  updateBalanceDisplay();
  updateCategories();
  updateBudgetDisplays();
  saveWallet();
  showNotification('Wallet created successfully!');
});
// Add logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    const confirmLogout = confirm('Are you sure you want to logout? Your wallet data will remain saved.');
    if (confirmLogout) {
        // Redirect to login/home page
        window.location.href = 'main.html';
    }
});

// Add reset wallet functionality
function resetWallet() {
    const confirmReset = confirm('Are you sure you want to reset your wallet? This will clear all transactions and data.');
    if (confirmReset) {
        wallet = {
            balance: 0,
            currency: 'USD',
            transactions: [],
            monthlyBudget: 0,
            currentMonthSpending: 0
        };
        
        categories = [
            { name: 'Food', budget: 500, spent: 0 },
            { name: 'Transport', budget: 300, spent: 0 },
            { name: 'Entertainment', budget: 200, spent: 0 }
        ];
        
        localStorage.removeItem('wallet');
        localStorage.removeItem('categories');
        
        walletContent.classList.add('hidden');
        walletSetup.classList.remove('hidden');
        
        // Reset form values
        initialBalance.value = '';
        initialCurrency.value = 'USD';
        document.getElementById('monthlyBudget').value = '';
        
        showNotification('Wallet has been reset successfully');
    }
}

// Add export functionality
function exportWalletData() {
    const data = {
        wallet: wallet,
        categories: categories,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import wallet data
function importWalletData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.wallet && data.categories) {
                    wallet = data.wallet;
                    categories = data.categories;
                    
                    // Convert date strings back to Date objects
                    wallet.transactions.forEach(t => t.date = new Date(t.date));
                    
                    saveWallet();
                    saveCategories();
                    
                    // Update UI
                    walletSetup.classList.add('hidden');
                    walletContent.classList.remove('hidden');
                    updateBalanceDisplay();
                    updateTransactionHistory();
                    updateCategories();
                    updateBudgetDisplays();
                    
                    showNotification('Wallet data imported successfully');
                } else {
                    showNotification('Invalid wallet data format');
                }
            } catch (error) {
                showNotification('Error importing wallet data');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S to save (export) wallet data
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        exportWalletData();
    }
    
    // Ctrl/Cmd + D to toggle dark mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        themeToggle.click();
    }
    
    // Esc to close calculator
    if (e.key === 'Escape') {
        const calculator = document.getElementById('calculator');
        if (calculator.classList.contains('active')) {
            calculator.classList.remove('active');
        }
    }
});

// Add event listeners for import/export functionality
document.getElementById('importBtn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = importWalletData;
    input.click();
});

document.getElementById('exportBtn')?.addEventListener('click', exportWalletData);

// Initialize tooltips and other UI enhancements
function initializeUIEnhancements() {
    // Add tooltip functionality if needed
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', (e) => {
            const tip = document.createElement('div');
            tip.className = 'tooltip';
            tip.textContent = e.target.dataset.tooltip;
            document.body.appendChild(tip);
            
            const rect = e.target.getBoundingClientRect();
            tip.style.top = `${rect.bottom + 10}px`;
            tip.style.left = `${rect.left + (rect.width - tip.offsetWidth) / 2}px`;
        });
        
        tooltip.addEventListener('mouseleave', () => {
            document.querySelector('.tooltip')?.remove();
        });
    });
}
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault(); // Prevent the default link behavior
  try {
      const response = await fetch('/api/logout', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          }
      });
      const data = await response.json();
      if (data.redirect) {
          window.location.href = data.redirect; // Redirect to the home page
      }
      else{
        window.location.href = data.redirect;
      }
  } catch (error) {
      console.error('Logout failed:', error);
  }
});

// Call initialization functions
initializeUIEnhancements();