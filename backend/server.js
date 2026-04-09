import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import adminRoutes from './routes/adminRoutes.js';
import { socketHandlers } from './socket/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Admin from './models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Base Route
app.get('/', (req, res) => {
  res.send('API is running...');
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
    console.log(`Connected to MongoDB`);
    
    // Pre-seed default admin account
    try {
      const adminExists = await Admin.findOne({ email: 'admin@admin.com' });
      if (!adminExists) {
        await Admin.create({ email: 'admin@admin.com', password: 'admin' });
        console.log('Pre-seeded default admin account: admin@admin.com / admin');
      }
    } catch(err) {
      console.log('Could not seed admin', err);
    }
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log('MongoDB connection error:', error);
  }
};

startServer();
