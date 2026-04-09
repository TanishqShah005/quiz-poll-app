import { io } from 'socket.io-client';

// Use env var or dynamically detect local IP for direct LAN hosting
const rawUrl = import.meta.env.VITE_BACKEND_URL || 'https://quizpoll-backend.onrender.com';
const SOCKET_URL = rawUrl.replace(/\/+$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
});
