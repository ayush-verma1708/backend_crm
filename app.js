import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import recordRoutes from './routes/recordRoutes.js';
import importRoutes from './routes/importRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();

// Middleware configurations
const allowedOrigins = 'http://localhost:5173';
// 'http://www.thewithinkers.com';

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000, // Set socket timeout to 1 minute
      // Timeout after 30 seconds
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process if connection fails
  }
};

// Initialize database connection
connectDB();

app.get('/', (req, res) => {
  res.send('Welcome to the CRM Backend!');
});

// Routes
app.use('/records', recordRoutes);

//User Routes
app.use('/api', userRoutes);

// Middleware and Routes
app.use('/api', importRoutes);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
