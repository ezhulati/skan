import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../contexts/AuthContext';

interface TableQR {
  tableNumber: string;
  qrCodeDataUrl: string;
  url: string;
}

const QRCodePage: React.FC = () => {
  const { } = useAuth();
  const [tables, setTables] = useState<TableQR[]>([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [baseUrl, setBaseUrl] = useState('http://localhost:3000');
  const printRef = useRef<HTMLDivElement>(null);

  const venueSlug = 'beach-bar-durres'; // This could be dynamic based on venue

  useEffect(() => {
    // Generate some default table QR codes
    generateQRCodes(['1', '2', '3', '4', '5', 'a1', 'a2', 'b1', 'b2']);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateQRCode = async (tableNumber: string): Promise<TableQR> => {
    const url = `${baseUrl}/order/${venueSlug}/${tableNumber}`;
    
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        tableNumber,
        qrCodeDataUrl,
        url
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  const generateQRCodes = useCallback(async (tableNumbers: string[]) => {
    setLoading(true);
    try {
      const qrCodes = await Promise.all(
        tableNumbers.map(table => generateQRCode(table))
      );
      setTables(qrCodes);
    } catch (error) {
      console.error('Error generating QR codes:', error);
      alert('Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, venueSlug]);

  const addTable = async () => {
    if (!newTableNumber.trim()) return;
    
    // Check if table already exists
    if (tables.some(table => table.tableNumber === newTableNumber.trim())) {
      alert('Table number already exists');
      return;
    }

    try {
      const qrCode = await generateQRCode(newTableNumber.trim());
      setTables(prev => [...prev, qrCode]);
      setNewTableNumber('');
    } catch (error) {
      alert('Failed to generate QR code for table');
    }
  };

  const removeTable = (tableNumber: string) => {
    setTables(prev => prev.filter(table => table.tableNumber !== tableNumber));
  };

  const downloadQRCode = (table: TableQR) => {
    const link = document.createElement('a');
    link.download = `table-${table.tableNumber}-qr.png`;
    link.href = table.qrCodeDataUrl;
    link.click();
  };

  const printQRCodes = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Refresh to restore event handlers
    }
  };

  const printSingleQRCode = (table: TableQR, size: 'small' | 'medium' | 'large' | 'fullpage' = 'medium') => {
    const getSizeConfig = (size: string) => {
      switch (size) {
        case 'small':
          return {
            qrSize: '2400px', // MASSIVE - 2x bigger
            fontSize: '64px',
            titleSize: '96px',
            urlSize: '48px',
            padding: '100px',
            maxWidth: '2600px',
            pageLayout: 'center'
          };
        case 'medium':
          return {
            qrSize: '2800px', // HUGE for table scanning
            fontSize: '76px',
            titleSize: '112px',
            urlSize: '56px',
            padding: '120px',
            maxWidth: '3040px',
            pageLayout: 'center'
          };
        case 'large':
          return {
            qrSize: '3200px', // ENORMOUS wall display
            fontSize: '88px',
            titleSize: '128px',
            urlSize: '64px',
            padding: '160px',
            maxWidth: '3520px',
            pageLayout: 'center'
          };
        case 'fullpage':
          return {
            qrSize: '3600px', // GIGANTIC full page
            fontSize: '100px',
            titleSize: '144px',
            urlSize: '72px',
            padding: '200px',
            maxWidth: '100%',
            pageLayout: 'fullpage'
          };
        default:
          return {
            qrSize: '2800px',
            fontSize: '76px',
            titleSize: '112px',
            urlSize: '56px',
            padding: '120px',
            maxWidth: '3040px',
            pageLayout: 'center'
          };
      }
    };

    const config = getSizeConfig(size);
    
    let printContent;
    
    if (config.pageLayout === 'grid') {
      // For small size, create a 2x1 grid to fit larger QR codes
      printContent = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          padding: 30px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr;
          gap: 30px;
          min-height: 100vh;
          box-sizing: border-box;
          align-items: center;
        ">
          ${Array(2).fill(0).map(() => `
            <div style="
              text-align: center;
              background: white;
              border: 2px solid #e0e0e0;
              border-radius: 12px;
              padding: ${config.padding};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: fit-content;
            ">
              <img 
                src="${table.qrCodeDataUrl}" 
                alt="QR Code for Table ${table.tableNumber}"
                style="
                  width: ${config.qrSize};
                  height: ${config.qrSize};
                  margin-bottom: 15px;
                  border-radius: 8px;
                "
              />
              <h2 style="
                font-size: ${config.titleSize};
                font-weight: 700;
                color: #2c3e50;
                margin: 0 0 8px 0;
              ">Table ${table.tableNumber}</h2>
              <p style="
                font-size: ${config.fontSize};
                color: #7f8c8d;
                margin: 0 0 10px 0;
              ">Scan to Order</p>
              <p style="
                font-size: ${config.urlSize};
                color: #95a5a6;
                margin: 0;
                word-break: break-all;
                text-align: center;
                line-height: 1.2;
              ">${table.url}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (config.pageLayout === 'fullpage') {
      // Full page layout
      printContent = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          padding: ${config.padding};
          box-sizing: border-box;
        ">
          <div style="
            text-align: center;
            background: white;
            border: 3px solid #2c3e50;
            border-radius: 20px;
            padding: ${config.padding};
            width: 100%;
            max-width: 90%;
          ">
            <img 
              src="${table.qrCodeDataUrl}" 
              alt="QR Code for Table ${table.tableNumber}"
              style="
                width: ${config.qrSize};
                height: ${config.qrSize};
                margin: 0 auto 40px auto;
                display: block;
                border-radius: 16px;
              "
            />
            <h2 style="
              font-size: ${config.titleSize};
              font-weight: 700;
              color: #2c3e50;
              margin: 0 0 20px 0;
            ">Table ${table.tableNumber}</h2>
            <p style="
              font-size: ${config.fontSize};
              color: #7f8c8d;
              margin: 0 0 30px 0;
              font-weight: 600;
            ">Scan to Order</p>
            <p style="
              font-size: ${config.urlSize};
              color: #95a5a6;
              margin: 0;
              word-break: break-all;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 10px;
            ">${table.url}</p>
          </div>
        </div>
      `;
    } else {
      // Center layout for medium and large
      printContent = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          padding: ${config.padding};
        ">
          <div style="
            text-align: center;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            padding: ${config.padding};
            max-width: ${config.maxWidth};
            width: 100%;
          ">
            <img 
              src="${table.qrCodeDataUrl}" 
              alt="QR Code for Table ${table.tableNumber}"
              style="
                width: ${config.qrSize};
                height: ${config.qrSize};
                margin: 0 auto 25px auto;
                display: block;
                border-radius: 12px;
              "
            />
            <h2 style="
              font-size: ${config.titleSize};
              font-weight: 700;
              color: #2c3e50;
              margin: 0 0 15px 0;
            ">Table ${table.tableNumber}</h2>
            <p style="
              font-size: ${config.fontSize};
              color: #7f8c8d;
              margin: 0 0 20px 0;
            ">Scan to Order</p>
            <p style="
              font-size: ${config.urlSize};
              color: #95a5a6;
              margin: 0;
              word-break: break-all;
            ">${table.url}</p>
          </div>
        </div>
      `;
    }
    
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      alert('URL copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy URL');
    });
  };

  return (
    <div className="qr-code-page">
      <header className="page-header">
        <h1>QR Code Generator</h1>
        <p>Generate QR codes for your restaurant tables</p>
      </header>

      <div className="qr-settings">
        <div className="setting-group">
          <label htmlFor="baseUrl">Base URL:</label>
          <input
            id="baseUrl"
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://yourdomain.com"
          />
        </div>

        <div className="setting-group">
          <label htmlFor="newTable">Add Table:</label>
          <div className="add-table-form">
            <input
              id="newTable"
              type="text"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="Table number (e.g., 1, a1, patio-1)"
              onKeyPress={(e) => e.key === 'Enter' && addTable()}
            />
            <button onClick={addTable} disabled={loading}>
              Add Table
            </button>
          </div>
        </div>

        <div className="actions">
          <button onClick={printQRCodes} className="print-button">
            Print All QR Codes
          </button>
          <button 
            onClick={() => generateQRCodes(tables.map(t => t.tableNumber))}
            disabled={loading}
            className="regenerate-button"
          >
            {loading ? 'Generating...' : 'Regenerate All'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <p>Generating QR codes...</p>
        </div>
      )}

      <div className="qr-grid" ref={printRef}>
        {tables.map((table) => (
          <div key={table.tableNumber} className="qr-card">
            <div className="qr-header">
              <h3>Table {table.tableNumber}</h3>
              <button 
                onClick={() => removeTable(table.tableNumber)}
                className="remove-button"
                title="Remove table"
              >
                ×
              </button>
            </div>
            
            <div className="qr-code-container">
              <img 
                src={table.qrCodeDataUrl} 
                alt={`QR Code for Table ${table.tableNumber}`}
                className="qr-image"
              />
            </div>
            
            <div className="qr-info">
              <p className="table-label">Table {table.tableNumber}</p>
              <p className="scan-instruction">Scan to Order</p>
              <p className="url">{table.url}</p>
            </div>

            <div className="qr-actions">
              <button 
                onClick={() => downloadQRCode(table)}
                className="download-button"
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download
              </button>
              
              <div className="print-size-selector">
                <label className="print-size-label">Print Size:</label>
                <div className="print-size-buttons">
                  <button 
                    onClick={() => printSingleQRCode(table, 'small')}
                    className="print-size-button small"
                    title="Small - Perfect for receipts and handouts"
                  >
                    <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    S
                  </button>
                  <button 
                    onClick={() => printSingleQRCode(table, 'medium')}
                    className="print-size-button medium"
                    title="Medium - Ideal for table tents and counter displays"
                  >
                    <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    M
                  </button>
                  <button 
                    onClick={() => printSingleQRCode(table, 'large')}
                    className="print-size-button large"
                    title="Large - Great for window displays and wall signage"
                  >
                    <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    L
                  </button>
                  <button 
                    onClick={() => printSingleQRCode(table, 'fullpage')}
                    className="print-size-button fullpage"
                    title="Extra Large - Maximum visibility for outdoor and drive-through displays"
                  >
                    <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    XL
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => copyToClipboard(table.url)}
                className="copy-button"
              >
                <svg className="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Copy URL
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && !loading && (
        <div className="empty-state">
          <p>No QR codes generated yet. Add some table numbers to get started!</p>
        </div>
      )}

      <style>{`
        .qr-code-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .page-header h1 {
          color: #333;
          margin-bottom: 10px;
        }

        .qr-settings {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }

        .setting-group {
          margin-bottom: 15px;
        }

        .setting-group label {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
          color: #333;
        }

        .setting-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .add-table-form {
          display: flex;
          gap: 10px;
        }

        .add-table-form input {
          flex: 1;
        }

        .add-table-form button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-table-form button:hover {
          background: #0056b3;
        }

        .actions {
          display: flex;
          gap: 15px;
          margin-top: 20px;
        }

        .print-button, .regenerate-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .print-button {
          background: #28a745;
          color: white;
        }

        .print-button:hover {
          background: #218838;
        }

        .regenerate-button {
          background: #17a2b8;
          color: white;
        }

        .regenerate-button:hover {
          background: #138496;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: #666;
        }

        .qr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .qr-card {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .qr-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .qr-header h3 {
          margin: 0;
          color: #333;
        }

        .remove-button {
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }

        .remove-button:hover {
          background: #c82333;
        }

        .qr-code-container {
          margin: 15px 0;
        }

        .qr-image {
          max-width: 100%;
          height: auto;
          border: 1px solid #eee;
          border-radius: 4px;
        }

        .qr-info {
          margin: 15px 0;
        }

        .table-label {
          font-size: 18px;
          font-weight: bold;
          margin: 5px 0;
          color: #333;
        }

        .scan-instruction {
          font-size: 14px;
          color: #666;
          margin: 5px 0;
        }

        .url {
          font-size: 12px;
          color: #888;
          word-break: break-all;
          margin: 10px 0;
        }

        .qr-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .print-size-selector {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 100%;
        }

        .print-size-label {
          font-size: 11px;
          font-weight: 600;
          color: #666;
          margin: 0;
        }

        .print-size-buttons {
          display: flex;
          gap: 4px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .print-size-button {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 2px;
          transition: all 0.2s ease;
          min-width: 32px;
          height: 28px;
          justify-content: center;
        }

        .print-size-button.small {
          background: #e3f2fd;
          color: #1976d2;
          border-color: #bbdefb;
        }

        .print-size-button.small:hover {
          background: #bbdefb;
          border-color: #1976d2;
          transform: translateY(-1px);
        }

        .print-size-button.medium {
          background: #e8f5e8;
          color: #388e3c;
          border-color: #c8e6c9;
        }

        .print-size-button.medium:hover {
          background: #c8e6c9;
          border-color: #388e3c;
          transform: translateY(-1px);
        }

        .print-size-button.large {
          background: #fff3e0;
          color: #f57c00;
          border-color: #ffcc02;
        }

        .print-size-button.large:hover {
          background: #ffcc02;
          border-color: #f57c00;
          transform: translateY(-1px);
        }

        .print-size-button.fullpage {
          background: #fce4ec;
          color: #c2185b;
          border-color: #f8bbd9;
        }

        .print-size-button.fullpage:hover {
          background: #f8bbd9;
          border-color: #c2185b;
          transform: translateY(-1px);
        }

        .download-button, .copy-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .download-button {
          background: #ffc107;
          color: #212529;
        }

        .download-button:hover {
          background: #e0a800;
        }

        .copy-button {
          background: #6c757d;
          color: white;
        }

        .copy-button:hover {
          background: #5a6268;
        }


        .button-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media print {
          .page-header, .qr-settings, .actions, .qr-actions, .remove-button {
            display: none !important;
          }

          .qr-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
            page-break-inside: avoid;
          }

          .qr-card {
            border: 2px solid #000 !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }

        @media (max-width: 768px) {
          .qr-grid {
            grid-template-columns: 1fr;
          }

          .actions {
            flex-direction: column;
          }

          .add-table-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodePage;