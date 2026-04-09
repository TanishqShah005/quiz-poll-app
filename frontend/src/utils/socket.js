import { io } from 'socket.io-client';

// Use env var or dynamically detect local IP for direct LAN hosting
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});
