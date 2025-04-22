# Test PowerShell script with suspicious patterns for monitoring detection

# Normal code
function Write-Log {
    param(
        [string]$Message
    )
    Write-Host $Message
}

Write-Log "Starting normal script execution..."

# Suspicious patterns below

# Pattern 1: Obfuscated command execution
$encodedCommand = "V3JpdGUtSG9zdCAiVGhpcyBjb21tYW5kIHdhcyBleGVjdXRlZCBmcm9tIGVuY29kZWQgY29udGVudCI="

# Pattern 2: PowerShell downgrade attempt
if($PSVersionTable.PSVersion.Major -ge 3) {
    Write-Log "Checking PowerShell version - potential downgrade attempt"
}

# Pattern 3: Suspicious download and execution
function Download-Execute {
    $url = "https://example.com/suspicious.ps1"
    $outPath = "$env:TEMP\temp_script.ps1"
    Write-Log "Would download from $url to $outPath"
}

# Pattern 4: AMSI bypass attempt (simplified)
function Check-Security {
    $a = [Ref].Assembly.GetTypes()
    Write-Log "Checking security modules"
}

# Pattern 5: Registry operations
function Add-Persistence {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    Write-Log "Would add persistence via $regPath"
}

# Execute functions (all are safe)
Write-Log "Executing test functions..."
Download-Execute
Add-Persistence
Check-Security

Write-Log "Script execution completed" 