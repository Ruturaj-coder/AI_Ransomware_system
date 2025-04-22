/**
 * Benign JavaScript Example
 * This file contains normal, non-suspicious JavaScript code
 */

// Simple utility functions
function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

function calculateTax(amount, rate = 0.07) {
    return amount * rate;
}

// DOM manipulation (non-suspicious)
function updateUI(elementId, value) {
    document.getElementById(elementId).textContent = value;
}

// Event handling
function setupEventListeners() {
    const button = document.getElementById('calculate');
    if (button) {
        button.addEventListener('click', function() {
            const amount = parseFloat(document.getElementById('amount').value) || 0;
            const taxRate = parseFloat(document.getElementById('tax-rate').value) || 0.07;
            
            const tax = calculateTax(amount, taxRate);
            const total = amount + tax;
            
            updateUI('tax-amount', formatCurrency(tax));
            updateUI('total-amount', formatCurrency(total));
        });
    }
}

// Data processing
function processUserData(userData) {
    const result = {
        name: userData.name || 'Guest',
        items: userData.items || [],
        total: 0
    };
    
    // Calculate totals
    if (result.items.length > 0) {
        result.total = result.items.reduce((sum, item) => sum + item.price, 0);
    }
    
    return result;
}

// API call example (using fetch, but not suspicious)
function fetchUserData(userId) {
    return fetch(`/api/users/${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            return response.json();
        })
        .then(data => {
            return processUserData(data);
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            return processUserData({});
        });
}

// Initialize application
function init() {
    setupEventListeners();
    console.log('Application initialized');
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 