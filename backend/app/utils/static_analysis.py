"""
Static analysis module for detecting suspicious patterns in script files.
This module supports JavaScript, HTML, Python, and PowerShell file analysis.
"""
import re
from typing import Dict, List, Tuple, Optional
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Common JavaScript obfuscation and suspicious patterns
JS_PATTERNS = {
    # Eval-based code execution
    "eval_usage": {
        "pattern": r"eval\s*\((.+?)\)",
        "description": "Use of eval() to execute arbitrary code",
        "severity": "high",
        "context_lines": 2
    },
    # Function constructor used for dynamic code execution
    "function_constructor": {
        "pattern": r"new\s+Function\s*\((.+?)\)",
        "description": "Use of Function constructor for dynamic code execution",
        "severity": "high",
        "context_lines": 2
    },
    # Encoded or obfuscated strings
    "encoded_strings": {
        "pattern": r"(?:atob|btoa|unescape|escape|decodeURIComponent|encodeURIComponent)\s*\((.+?)\)",
        "description": "String encoding/decoding functions",
        "severity": "medium",
        "context_lines": 1
    },
    # Suspicious DOM manipulation (document.write)
    "document_write": {
        "pattern": r"document\.write\s*\((.+?)\)",
        "description": "Dynamic content injection with document.write",
        "severity": "medium",
        "context_lines": 1
    },
    # Base64 encoded strings (potential obfuscation)
    "base64_content": {
        "pattern": r"['\"]([A-Za-z0-9+/]{20,}(?:==|=)?)['\"]",
        "description": "Potential Base64 encoded content",
        "severity": "low",
        "context_lines": 0
    },
    # Suspicious URL/IP access
    "network_access": {
        "pattern": r"(?:https?:\/\/|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})",
        "description": "Network access to external resources",
        "severity": "medium",
        "context_lines": 1
    },
    # File system access attempts
    "filesystem_access": {
        "pattern": r"(?:fs\.|require\(['\"]fs['\"]\)|FileSystem|ActiveXObject\(['\"]Scripting\.FileSystemObject['\"]\))",
        "description": "Attempt to access file system",
        "severity": "high",
        "context_lines": 2
    },
    # Suspicious environment detection
    "environment_detection": {
        "pattern": r"navigator\.userAgent|screen\.width|screen\.height|navigator\.language|navigator\.platform",
        "description": "Environment detection (potential fingerprinting)",
        "severity": "low",
        "context_lines": 1
    },
    # Suspicious string obfuscation
    "string_obfuscation": {
        "pattern": r"String\.fromCharCode|charCodeAt\(\d+\)|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}",
        "description": "String obfuscation techniques",
        "severity": "medium",
        "context_lines": 1
    },
    # Potential websocket usage for C2 communication
    "websocket_usage": {
        "pattern": r"new\s+WebSocket\s*\(['\"]ws",
        "description": "WebSocket communication",
        "severity": "medium",
        "context_lines": 1
    }
}

# HTML suspicious patterns
HTML_PATTERNS = {
    # Obfuscated JavaScript
    "obfuscated_script": {
        "pattern": r"<script[^>]*>(?:(?!<\/script>).)*?(eval|String\.fromCharCode|unescape|escape|atob|btoa|\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4})(?:(?!<\/script>).)*?<\/script>",
        "description": "Obfuscated JavaScript code in script tag",
        "severity": "high",
        "context_lines": 2
    },
    # Hidden or zero-sized iframes
    "suspicious_iframe": {
        "pattern": r"<iframe[^>]*(?:hidden|display\s*:\s*none|visibility\s*:\s*hidden|width\s*=\s*['\"]?0|height\s*=\s*['\"]?0)[^>]*>",
        "description": "Hidden or zero-sized iframe (potential malicious content)",
        "severity": "high",
        "context_lines": 2
    },
    # Script tag with suspicious src attribute
    "suspicious_script_src": {
        "pattern": r"<script[^>]*src\s*=\s*['\"](?:https?:)?\/\/(?!(?:code\.jquery\.com|cdnjs\.cloudflare\.com|ajax\.googleapis\.com|cdn\.jsdelivr\.net|unpkg\.com|stackpath\.bootstrapcdn\.com))([^'\"]+)['\"][^>]*>",
        "description": "Script loaded from suspicious external source",
        "severity": "medium",
        "context_lines": 1
    },
    # Encoded content in attributes
    "encoded_attribute": {
        "pattern": r"<[^>]+(?:src|href|data|style|onerror|onload|onclick)\s*=\s*['\"](?:data:text\/html|javascript:)[^'\"]*(?:base64|eval|atob|fromCharCode|escape|unescape)[^'\"]*['\"]",
        "description": "Encoded content in HTML attributes",
        "severity": "high",
        "context_lines": 2
    },
    # Script injection via event handlers
    "event_handler_script": {
        "pattern": r"<[^>]+(?:on\w+)\s*=\s*['\"][^'\"]*(?:eval|Function|setTimeout|setInterval|document\.write)[^'\"]*['\"]",
        "description": "JavaScript execution via event handler",
        "severity": "high",
        "context_lines": 2
    },
    # Meta refresh to suspicious URL
    "meta_refresh": {
        "pattern": r"<meta[^>]*http-equiv\s*=\s*['\"]refresh['\"][^>]*content\s*=\s*['\"][^'\"]*url\s*=\s*(?!https?:\/\/(?:www\.)?(?:google\.com|microsoft\.com|apple\.com))[^'\"]*['\"]",
        "description": "Suspicious page redirect via meta refresh",
        "severity": "medium",
        "context_lines": 1
    },
    # Base tag manipulation
    "base_tag_manipulation": {
        "pattern": r"<base[^>]*href\s*=\s*['\"](?!https?:\/\/(?:www\.)?(?:google\.com|microsoft\.com|apple\.com))[^'\"]+['\"]",
        "description": "Base tag manipulation (can redirect relative URLs)",
        "severity": "medium",
        "context_lines": 1
    }
}

# Python suspicious patterns
PYTHON_PATTERNS = {
    # Exec/eval usage
    "exec_eval_usage": {
        "pattern": r"(?:exec|eval)\s*\((.+?)\)",
        "description": "Use of exec/eval to execute arbitrary code",
        "severity": "high",
        "context_lines": 2
    },
    # OS system calls
    "os_system_calls": {
        "pattern": r"(?:os\.system|subprocess\.(?:call|Popen|run)|commands\.getoutput|popen|popen2|exec[lv][ep]?)\s*\((.+?)\)",
        "description": "OS command execution",
        "severity": "high",
        "context_lines": 2
    },
    # Suspicious imports
    "suspicious_imports": {
        "pattern": r"import\s+(?:subprocess|os|sys|tempfile|shutil|base64|binascii|zlib|pickle|marshal|ctypes|socket)",
        "description": "Import of potentially dangerous module",
        "severity": "medium",
        "context_lines": 1
    },
    # Network connections
    "network_operations": {
        "pattern": r"(?:socket\.(?:socket|connect|bind|listen|accept)|urllib\.(?:request|parse)|requests\.(?:get|post|put|delete|patch))",
        "description": "Network connection operation",
        "severity": "medium",
        "context_lines": 1
    },
    # File operations
    "file_operations": {
        "pattern": r"(?:open|file)\s*\([^,)]+,\s*['\"](?:w|a|r\+|w\+|a\+|wb|ab|r\+b|w\+b|a\+b)['\"]",
        "description": "File write operation",
        "severity": "medium",
        "context_lines": 1
    },
    # Base64 encoding/decoding
    "base64_operations": {
        "pattern": r"base64\.(?:b64encode|b64decode|standard_b64encode|standard_b64decode)",
        "description": "Base64 encoding/decoding (potential obfuscation)",
        "severity": "medium",
        "context_lines": 1
    },
    # Temp file creation
    "temp_file_creation": {
        "pattern": r"tempfile\.(?:NamedTemporaryFile|mkstemp|mkdtemp)",
        "description": "Temporary file/directory creation",
        "severity": "low",
        "context_lines": 1
    },
    # Code compilation
    "code_compilation": {
        "pattern": r"compile\s*\((.+?),\s*[\'\"]",
        "description": "Dynamic code compilation",
        "severity": "high",
        "context_lines": 2
    },
    # Process creation
    "process_creation": {
        "pattern": r"multiprocessing\.Process|threading\.Thread|concurrent\.futures",
        "description": "Process/thread creation",
        "severity": "low",
        "context_lines": 1
    }
}

# PowerShell suspicious patterns
POWERSHELL_PATTERNS = {
    # Obfuscated commands
    "obfuscated_command": {
        "pattern": r"\$(?:\w+)\s*=\s*(?:\[[^\]]+\])?(?:'\w{1,2}'\s*\+\s*)+|(?:-join|join)\s+(?:\[char\]\d+\s*(?:,\s*)?)+|(?:\[[char\]\]\s*\(\s*\d+\s*(?:,\s*\d+\s*)*\)\s*-join\s*'')",
        "description": "Obfuscated command construction",
        "severity": "high",
        "context_lines": 2
    },
    # Base64 encoded payloads
    "base64_payload": {
        "pattern": r"(?:-enc|-encodedcommand|-e)\s+[A-Za-z0-9+/]{20,}(?:==)?|(?:FromBase64String|ConvertTo-SecureString)(?:\s*\(\s*|\s+)(?:['\"])(?:[A-Za-z0-9+/]{20,}(?:==)?)(?:['\"])",
        "description": "Base64 encoded payload",
        "severity": "high",
        "context_lines": 2
    },
    # Suspicious cmdlets
    "suspicious_cmdlets": {
        "pattern": r"(?:Invoke-Expression|IEX|Invoke-Command|Invoke-WmiMethod|Invoke-CimMethod|New-Object|Start-Process|New-Service|Start-Job|Invoke-Item|Invoke-WebRequest|wget|curl|Net\.WebClient|DownloadString|DownloadFile)",
        "description": "Potentially dangerous cmdlet usage",
        "severity": "high",
        "context_lines": 2
    },
    # Script downloading
    "script_download": {
        "pattern": r"(?:Net\.WebClient|System\.Net\.WebClient|Invoke-WebRequest|curl|wget|Start-BitsTransfer)[\s\S]{0,60}?(?:DownloadString|DownloadFile|OutFile)",
        "description": "Download and potential execution of external content",
        "severity": "high",
        "context_lines": 2
    },
    # Execution bypass
    "execution_bypass": {
        "pattern": r"(?:-ExecutionPolicy\s+Bypass|-EP\s+Bypass|-Exec\s+Bypass|ExecutionPolicy\s+(?:Unrestricted|Bypass))",
        "description": "Bypassing PowerShell execution policy",
        "severity": "high",
        "context_lines": 2
    },
    # Hidden window execution
    "hidden_execution": {
        "pattern": r"(?:-WindowStyle\s+Hidden|-W\s+Hidden|WindowStyle\s*=\s*\"Hidden\"|\$Host\.UI\.RawUI\.WindowSize\.Height\s*=\s*0)",
        "description": "Hiding PowerShell console window",
        "severity": "high",
        "context_lines": 2
    },
    # WMI usage
    "wmi_usage": {
        "pattern": r"(?:Get-WmiObject|gwmi|WmiObject|Invoke-WmiMethod|Get-CimInstance|New-CimInstance)",
        "description": "WMI/CIM interaction (potential for system changes)",
        "severity": "medium",
        "context_lines": 1
    },
    # Registry operations
    "registry_operations": {
        "pattern": r"(?:HKLM:|HKCU:|Registry::|Microsoft\.Win32\.Registry)",
        "description": "Registry manipulation",
        "severity": "medium",
        "context_lines": 1
    },
    # Scheduled task creation
    "scheduled_task": {
        "pattern": r"(?:New-ScheduledTask|Register-ScheduledTask|schtasks)",
        "description": "Scheduled task creation/manipulation",
        "severity": "medium",
        "context_lines": 1
    }
}

def analyze_javascript(content: str) -> List[Dict]:
    """
    Analyze JavaScript content for suspicious patterns.
    
    Args:
        content: JavaScript code content as string
        
    Returns:
        List of dictionaries containing detection results
    """
    results = []
    lines = content.split('\n')
    
    for pattern_name, pattern_info in JS_PATTERNS.items():
        regex = pattern_info["pattern"]
        severity = pattern_info["severity"]
        description = pattern_info["description"]
        context_lines = pattern_info["context_lines"]
        
        for line_num, line in enumerate(lines, 1):
            matches = re.finditer(regex, line)
            
            for match in matches:
                # Extract the matched string
                matched_text = match.group(0)
                
                # Get context (surrounding lines)
                start_line = max(0, line_num - context_lines - 1)
                end_line = min(len(lines), line_num + context_lines)
                context = lines[start_line:end_line]
                
                result = {
                    "pattern_name": pattern_name,
                    "description": description,
                    "severity": severity,
                    "line_number": line_num,
                    "matched_text": matched_text,
                    "context": context
                }
                results.append(result)
    
    return results

def analyze_html(content: str) -> List[Dict]:
    """
    Analyze HTML content for suspicious patterns.
    
    Args:
        content: HTML code content as string
        
    Returns:
        List of dictionaries containing detection results
    """
    results = []
    lines = content.split('\n')
    
    # For patterns that might span multiple lines, we'll also check against the full content
    for pattern_name, pattern_info in HTML_PATTERNS.items():
        regex = pattern_info["pattern"]
        severity = pattern_info["severity"]
        description = pattern_info["description"]
        context_lines = pattern_info["context_lines"]
        
        # Some HTML patterns may span multiple lines, so we need to search in the full content
        # and map the matches back to line numbers
        if pattern_name in ["obfuscated_script", "suspicious_iframe"]:
            matches = re.finditer(regex, content, re.DOTALL | re.IGNORECASE)
            for match in matches:
                matched_text = match.group(0)
                
                # Find the line number by counting newlines before the match
                content_before_match = content[:match.start()]
                line_num = content_before_match.count('\n') + 1
                
                # Get context
                start_line = max(0, line_num - context_lines - 1)
                end_line = min(len(lines), line_num + context_lines)
                context = lines[start_line:end_line]
                
                result = {
                    "pattern_name": pattern_name,
                    "description": description,
                    "severity": severity,
                    "line_number": line_num,
                    "matched_text": matched_text[:100] + ("..." if len(matched_text) > 100 else ""),  # Truncate if too long
                    "context": context
                }
                results.append(result)
        else:
            # For simpler patterns, search line by line
            for line_num, line in enumerate(lines, 1):
                matches = re.finditer(regex, line, re.IGNORECASE)
                
                for match in matches:
                    matched_text = match.group(0)
                    
                    # Get context
                    start_line = max(0, line_num - context_lines - 1)
                    end_line = min(len(lines), line_num + context_lines)
                    context = lines[start_line:end_line]
                    
                    result = {
                        "pattern_name": pattern_name,
                        "description": description,
                        "severity": severity,
                        "line_number": line_num,
                        "matched_text": matched_text,
                        "context": context
                    }
                    results.append(result)
    
    return results

def analyze_python(content: str) -> List[Dict]:
    """
    Analyze Python content for suspicious patterns.
    
    Args:
        content: Python code content as string
        
    Returns:
        List of dictionaries containing detection results
    """
    results = []
    lines = content.split('\n')
    
    for pattern_name, pattern_info in PYTHON_PATTERNS.items():
        regex = pattern_info["pattern"]
        severity = pattern_info["severity"]
        description = pattern_info["description"]
        context_lines = pattern_info["context_lines"]
        
        for line_num, line in enumerate(lines, 1):
            matches = re.finditer(regex, line)
            
            for match in matches:
                matched_text = match.group(0)
                
                # Get context
                start_line = max(0, line_num - context_lines - 1)
                end_line = min(len(lines), line_num + context_lines)
                context = lines[start_line:end_line]
                
                result = {
                    "pattern_name": pattern_name,
                    "description": description,
                    "severity": severity,
                    "line_number": line_num,
                    "matched_text": matched_text,
                    "context": context
                }
                results.append(result)
    
    return results

def analyze_powershell(content: str) -> List[Dict]:
    """
    Analyze PowerShell content for suspicious patterns.
    
    Args:
        content: PowerShell script content as string
        
    Returns:
        List of dictionaries containing detection results
    """
    results = []
    lines = content.split('\n')
    
    for pattern_name, pattern_info in POWERSHELL_PATTERNS.items():
        regex = pattern_info["pattern"]
        severity = pattern_info["severity"]
        description = pattern_info["description"]
        context_lines = pattern_info["context_lines"]
        
        # Check for pattern spans that might cover multiple lines
        if pattern_name in ["script_download", "obfuscated_command"]:
            matches = re.finditer(regex, content, re.IGNORECASE | re.DOTALL)
            for match in matches:
                matched_text = match.group(0)
                
                # Find the line number
                content_before_match = content[:match.start()]
                line_num = content_before_match.count('\n') + 1
                
                # Get context
                start_line = max(0, line_num - context_lines - 1)
                end_line = min(len(lines), line_num + context_lines)
                context = lines[start_line:end_line]
                
                result = {
                    "pattern_name": pattern_name,
                    "description": description,
                    "severity": severity,
                    "line_number": line_num,
                    "matched_text": matched_text[:100] + ("..." if len(matched_text) > 100 else ""),
                    "context": context
                }
                results.append(result)
        else:
            # For simpler patterns, search line by line
            for line_num, line in enumerate(lines, 1):
                matches = re.finditer(regex, line, re.IGNORECASE)
                
                for match in matches:
                    matched_text = match.group(0)
                    
                    # Get context
                    start_line = max(0, line_num - context_lines - 1)
                    end_line = min(len(lines), line_num + context_lines)
                    context = lines[start_line:end_line]
                    
                    result = {
                        "pattern_name": pattern_name,
                        "description": description,
                        "severity": severity,
                        "line_number": line_num,
                        "matched_text": matched_text,
                        "context": context
                    }
                    results.append(result)
    
    return results

def get_pattern_count(analysis_results: List[Dict]) -> Dict[str, int]:
    """
    Get count of each pattern found in the analysis results.
    
    Args:
        analysis_results: List of analysis results from analysis functions
        
    Returns:
        Dictionary mapping pattern names to their occurrence count
    """
    pattern_count = {}
    for result in analysis_results:
        pattern_name = result["pattern_name"]
        pattern_count[pattern_name] = pattern_count.get(pattern_name, 0) + 1
    
    return pattern_count

def calculate_suspicion_score(analysis_results: List[Dict]) -> float:
    """
    Calculate a suspicion score based on the analysis results.
    
    Args:
        analysis_results: List of analysis results from analysis functions
        
    Returns:
        Float between 0 and 1 indicating suspicion level
    """
    if not analysis_results:
        return 0.0
    
    # Weights based on severity
    severity_weights = {
        "high": 1.0,
        "medium": 0.6,
        "low": 0.3
    }
    
    total_score = 0.0
    for result in analysis_results:
        severity = result["severity"]
        weight = severity_weights.get(severity, 0.5)
        total_score += weight
    
    # Normalize to a score between 0 and 1, capped at 1.0
    # Using a steeper curve to ensure benign code with few minor matches stays close to 0
    normalized_score = min(1.0, 1 - (1 / (1 + 0.5 * total_score)))
    
    # If total score is very low (only one low-severity detection), force to zero
    if total_score <= 0.3:
        normalized_score = 0.0
    
    return normalized_score

def analyze_file_content(file_content: str, file_type: str) -> Dict:
    """
    Analyze file content based on file type.
    
    Args:
        file_content: Content of the file to analyze
        file_type: Type of the file (e.g., 'javascript', 'html', 'python', 'powershell')
        
    Returns:
        Dictionary containing analysis results
    """
    if not file_content:
        return {
            "success": False,
            "error": "Empty file content",
            "results": [],
            "summary": {
                "pattern_count": {},
                "total_detections": 0,
                "suspicion_score": 0.0
            }
        }
    
    try:
        results = []
        
        file_type = file_type.lower()
        
        if file_type in ['javascript', 'js']:
            results = analyze_javascript(file_content)
        elif file_type in ['html', 'htm']:
            results = analyze_html(file_content)
        elif file_type in ['python', 'py']:
            results = analyze_python(file_content)
        elif file_type in ['powershell', 'ps1']:
            results = analyze_powershell(file_content)
        else:
            return {
                "success": False,
                "error": f"Unsupported file type: {file_type}",
                "results": [],
                "summary": {
                    "pattern_count": {},
                    "total_detections": 0,
                    "suspicion_score": 0.0
                }
            }
        
        pattern_count = get_pattern_count(results)
        suspicion_score = calculate_suspicion_score(results)
        
        return {
            "success": True,
            "results": results,
            "summary": {
                "pattern_count": pattern_count,
                "total_detections": len(results),
                "suspicion_score": suspicion_score
            }
        }
        
    except Exception as e:
        logger.error(f"Error analyzing file content: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "results": [],
            "summary": {
                "pattern_count": {},
                "total_detections": 0,
                "suspicion_score": 0.0
            }
        }

def get_patterns_by_file_type(file_type: str) -> Dict:
    """
    Get the patterns dictionary for a specific file type.
    
    Args:
        file_type: Type of the file (e.g., 'javascript', 'html', 'python', 'powershell')
        
    Returns:
        Dictionary of patterns for the specified file type
    """
    file_type = file_type.lower()
    
    if file_type in ['javascript', 'js']:
        return JS_PATTERNS
    elif file_type in ['html', 'htm']:
        return HTML_PATTERNS
    elif file_type in ['python', 'py']:
        return PYTHON_PATTERNS
    elif file_type in ['powershell', 'ps1']:
        return POWERSHELL_PATTERNS
    else:
        return {} 