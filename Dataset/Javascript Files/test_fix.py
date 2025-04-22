#!/usr/bin/env python3
"""
Test Python file for monitoring with various suspicious patterns
"""

import os
import sys

# Normal code
def normal_function():
    """A normal function that does nothing suspicious"""
    print("This is a normal function")
    return "Normal result"

# Suspicious patterns below

# Pattern 1: Using eval (commented out)
def dynamic_execution():
    code = "print('This would be dynamically executed')"
    # eval(code)
    print(f"Would execute: {code}")

# Pattern 2: Command execution reference
def execute_command(cmd):
    """Reference to command execution"""
    print(f"Would execute: {cmd}")
    return f"Command result for: {cmd}"

# Pattern 3: File operations in suspicious locations
def access_files():
    """Reference to accessing sensitive files"""
    sensitive_paths = ["/etc/passwd", "C:\\Windows\\System32\\config", "/var/log"]
    for path in sensitive_paths:
        print(f"Would access: {path}")

# Pattern 4: Network connection reference
def create_connection():
    """Reference to creating network connections"""
    host = "example.com"
    port = 4444
    print(f"Would connect to: {host}:{port}")

# Pattern 5: Import references
def import_libraries():
    """References importing potentially dangerous modules"""
    libs = ["subprocess", "socket", "ctypes", "base64"]
    print(f"Would import: {', '.join(libs)}")

if __name__ == "__main__":
    normal_function()
    dynamic_execution()
    execute_command("whoami")
    access_files()
    create_connection()
    import_libraries()
    print("Test completed") 