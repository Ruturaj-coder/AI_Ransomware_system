"""
Real-time file monitoring system that watches directories for new or modified files.
"""
import os
import time
import threading
import logging
import queue
from typing import Dict, List, Set, Callable, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileCreatedEvent, FileModifiedEvent

# Configure logging
logger = logging.getLogger(__name__)

class FileMonitorHandler(FileSystemEventHandler):
    """
    Custom event handler for file system events.
    """
    def __init__(self, callback: Callable, file_extensions: List[str] = None):
        """
        Initialize the file monitor handler.
        
        Args:
            callback: Function to call when a file is created or modified
            file_extensions: List of file extensions to monitor (e.g., ['.js', '.py'])
        """
        self.callback = callback
        self.file_extensions = file_extensions or ['.js', '.html', '.htm', '.py', '.ps1']
        self.file_queue = queue.Queue()
        self.processing_thread = threading.Thread(target=self._process_queue, daemon=True)
        self.processing_thread.start()
        
    def on_created(self, event):
        """Handle file creation events."""
        if not event.is_directory and self._is_valid_file(event.src_path):
            logger.info(f"File created: {event.src_path}")
            self.file_queue.put(('created', event.src_path))
            
    def on_modified(self, event):
        """Handle file modification events."""
        if not event.is_directory and self._is_valid_file(event.src_path):
            logger.info(f"File modified: {event.src_path}")
            self.file_queue.put(('modified', event.src_path))
    
    def _is_valid_file(self, file_path: str) -> bool:
        """
        Check if the file has a valid extension for monitoring.
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if the file has a valid extension, False otherwise
        """
        if not self.file_extensions:
            return True
            
        _, ext = os.path.splitext(file_path.lower())
        return ext in self.file_extensions
    
    def _process_queue(self):
        """
        Process files in the queue to avoid overwhelming the system with events.
        Implements a simple debouncing mechanism to handle rapid file changes.
        """
        processed_files = set()
        
        while True:
            try:
                event_type, file_path = self.file_queue.get(timeout=1)
                
                # Skip if this file was recently processed (debouncing)
                if file_path in processed_files:
                    self.file_queue.task_done()
                    continue
                
                # Process the file
                try:
                    # Determine file type from extension
                    _, ext = os.path.splitext(file_path.lower())
                    file_type = ext[1:] if ext else ''
                    
                    # Map extension to type
                    file_type_mapping = {
                        'js': 'javascript',
                        'html': 'html',
                        'htm': 'html',
                        'py': 'python',
                        'ps1': 'powershell'
                    }
                    
                    file_type = file_type_mapping.get(file_type, file_type)
                    
                    # Wait a moment to ensure the file is fully written
                    time.sleep(0.5)
                    
                    # Call the callback with the file path and type
                    self.callback(file_path, file_type, event_type)
                    
                    # Add to processed files
                    processed_files.add(file_path)
                    
                    # Clean up processed_files periodically to avoid memory buildup
                    if len(processed_files) > 100:
                        processed_files = set(list(processed_files)[-50:])
                        
                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {str(e)}")
                
                self.file_queue.task_done()
                
            except queue.Empty:
                # Clean the processed files list when the queue is empty
                processed_files.clear()
            except Exception as e:
                logger.error(f"Error in file processing thread: {str(e)}")
                time.sleep(1)  # Avoid CPU spinning on repeated errors


class FileMonitor:
    """
    Monitors directories for file creation and modification events.
    """
    def __init__(self):
        self.observers = {}  # Map of path to Observer instances
        self.handler = None
        self.monitored_paths = set()
        self.running = False
    
    def start_monitoring(self, paths: List[str], callback: Callable, file_extensions: List[str] = None) -> Dict:
        """
        Start monitoring the specified directories.
        
        Args:
            paths: List of directory paths to monitor
            callback: Function to call when files are created or modified
            file_extensions: List of file extensions to monitor
            
        Returns:
            Dictionary with the status of the monitoring operation
        """
        if self.running:
            return {"status": "already_running", "message": "Monitoring is already active"}
        
        self.handler = FileMonitorHandler(callback, file_extensions)
        
        valid_paths = []
        invalid_paths = []
        
        for path in paths:
            if not os.path.exists(path) or not os.path.isdir(path):
                invalid_paths.append(path)
                continue
                
            try:
                observer = Observer()
                observer.schedule(self.handler, path, recursive=True)
                observer.start()
                
                self.observers[path] = observer
                self.monitored_paths.add(path)
                valid_paths.append(path)
                
                logger.info(f"Started monitoring: {path}")
            except Exception as e:
                invalid_paths.append(path)
                logger.error(f"Error setting up monitoring for {path}: {str(e)}")
        
        if valid_paths:
            self.running = True
            return {
                "status": "started",
                "monitored_paths": valid_paths,
                "invalid_paths": invalid_paths,
                "file_extensions": file_extensions
            }
        else:
            return {
                "status": "failed",
                "message": "No valid paths to monitor",
                "invalid_paths": invalid_paths
            }
    
    def stop_monitoring(self) -> Dict:
        """
        Stop all active monitoring.
        
        Returns:
            Dictionary with the status of the operation
        """
        if not self.running:
            return {"status": "not_running", "message": "Monitoring is not active"}
            
        for path, observer in self.observers.items():
            observer.stop()
            observer.join()
            logger.info(f"Stopped monitoring: {path}")
        
        self.observers.clear()
        self.monitored_paths.clear()
        self.running = False
        
        return {"status": "stopped", "message": "File monitoring stopped"}
    
    def get_status(self) -> Dict:
        """
        Get the current monitoring status.
        
        Returns:
            Dictionary with the current status
        """
        return {
            "running": self.running,
            "monitored_paths": list(self.monitored_paths),
            "file_extensions": self.handler.file_extensions if self.handler else None
        }

# Singleton instance
monitor = FileMonitor() 