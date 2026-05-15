import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`;

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 300,
  reconnectionDelayMax: 2000,
  timeout: 8000,
  transports: ['websocket', 'polling'],
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !socket.connected) {
    socket.disconnect();
    socket.connect();
  }
});

window.addEventListener('online', () => {
  if (!socket.connected) {
    socket.disconnect();
    socket.connect();
  }
});

export default socket;
