import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

const ContactImport = ({ isOpen, onClose, onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      setImportResult({
        success: false,
        message: 'Please select a CSV or Excel file (.csv, .xlsx, .xls)'
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      const mockImportResult = {
        success: true,
        message: 'Successfully imported 15 contacts',
        details: {
          total: 15,
          successful: 14,
          failed: 1,
          duplicates: 2
        }
      };
      
      setImportResult(mockImportResult);
      setImporting(false);
      
      // Call parent import handler
      if (onImport) {
        onImport(mockImportResult);
      }
    }, 2000);
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    setImporting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Import Contacts</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {!file && !importResult && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your contact file here, or
              </p>
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  browse to upload
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Supports CSV, Excel (.xlsx, .xls) files
              </p>
            </div>
          )}

          {file && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="text-blue-600" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={resetImport}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">Expected columns:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Name (required)</li>
                  <li>Email (required)</li>
                  <li>Phone</li>
                  <li>Company</li>
                  <li>Stage</li>
                </ul>
              </div>
            </div>
          )}

          {importResult && (
            <div className={`p-4 rounded-lg ${
              importResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {importResult.success ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <AlertCircle className="text-red-600" size={20} />
                )}
                <p className={`font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.message}
                </p>
              </div>
              
              {importResult.success && importResult.details && (
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Total contacts: {importResult.details.total}</p>
                  <p>• Successfully imported: {importResult.details.successful}</p>
                  <p>• Failed: {importResult.details.failed}</p>
                  <p>• Duplicates skipped: {importResult.details.duplicates}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          
          {file && !importResult && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing...' : 'Import Contacts'}
            </button>
          )}
          
          {importResult && (
            <button
              onClick={resetImport}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import Another File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactImport;
