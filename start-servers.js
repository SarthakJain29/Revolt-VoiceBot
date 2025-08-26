import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Voice Chat Application...\n');

// Start backend server
const backend = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

console.log('📡 Backend server starting on port 3001...');

// Wait a moment for backend to start, then start frontend
setTimeout(() => {
  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  console.log('🌐 Frontend server starting on port 8081...\n');
  console.log('✅ Both servers are running!');
  console.log('📱 Open http://localhost:8081 in your browser');
  console.log('🔗 Backend API: http://localhost:3001');
  console.log('🔗 WebSocket: ws://localhost:3001\n');

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

}, 2000);
