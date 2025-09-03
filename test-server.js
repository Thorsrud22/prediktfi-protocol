#!/usr/bin/env node

// Simple test script to check if dev server crashes
const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting dev server crash test...');

let serverProcess;
let crashed = false;

function cleanup() {
  if (serverProcess) {
    console.log('🧹 Cleaning up dev server...');
    serverProcess.kill('SIGTERM');
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start dev server
serverProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
});

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('📄', output.trim());
  
  // Check if server is ready
  if (output.includes('Ready in') || output.includes('started server')) {
    console.log('✅ Server started, testing requests...');
    setTimeout(() => testRequests(), 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('❌', data.toString().trim());
});

serverProcess.on('exit', (code) => {
  crashed = true;
  console.log(`💥 Server exited with code ${code}`);
  if (code !== 0) {
    console.log('🚨 DEV SERVER CRASHED!');
  }
  process.exit(code);
});

function testRequests() {
  if (crashed) return;
  
  const requests = [
    'http://localhost:3000/',
    'http://localhost:3000/studio',
    'http://localhost:3000/api/test-geofence'
  ];
  
  let completed = 0;
  
  requests.forEach((url, index) => {
    setTimeout(() => {
      if (crashed) return;
      
      console.log(`🌐 Testing ${url}...`);
      
      const req = http.get(url, (res) => {
        console.log(`✅ ${url} → ${res.statusCode}`);
        completed++;
        
        if (completed === requests.length) {
          console.log('🎉 All requests completed successfully!');
          setTimeout(() => {
            cleanup();
            process.exit(0);
          }, 1000);
        }
      });
      
      req.on('error', (err) => {
        console.error(`❌ ${url} → Error: ${err.message}`);
        completed++;
      });
      
      req.setTimeout(5000, () => {
        console.error(`⏰ ${url} → Timeout`);
        req.destroy();
        completed++;
      });
      
    }, index * 1000);
  });
}

console.log('⏳ Waiting for server to start...');
