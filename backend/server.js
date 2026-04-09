import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/adminRoutes.js';
import { socketHandlers } from './socket/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';


dotenv.config();

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.FRONTEND_URL || '*';

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Socket.io
socketHandlers(io);

// DB Connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    
    // Check if we want to use local memory server for seamless demo
    if (!mongoUri || mongoUri.includes('127.0.0.1')) {
       console.log('Starting in-memory MongoDB server for demo purposes...');
       const mongod = await MongoMemoryServer.create();
       mongoUri = mongod.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB Atlas / In-Memory`);
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
};

startServer();
