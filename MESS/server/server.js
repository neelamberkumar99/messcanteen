require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const mongoSanitize = require('express-mongo-sanitize');

// Routes
const authRoutes = require('./routes/authRoutes');
const dietRoutes = require('./routes/dietRoutes');
const billingRoutes = require('./routes/billingRoutes');
const fineRoutes = require('./routes/fineRoutes');
const orderRoutes = require('./routes/orderRoutes');
const canteenRoutes = require('./routes/canteenRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');

const { updateFinesForOverdueBills } = require('./services/billingService');
const { autoResetDiets } = require('./services/dietService');
const { sendUpcomingPaymentReminders } = require('./services/notificationService');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Rate limiting (in production, use Redis-backed rate limiter)
const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 100, // relaxed for development
  message: 'Too many requests from this IP, please try again later'
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 5, // limit login attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// Apply global rate limiter
app.use('/api/', limiter);
// Apply stricter limiter to auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/canteen', canteenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Error handler (should be last middleware)
app.use(errorHandler);

// Connect DB and start server
connectDB().then(() => {
	const PORT = process.env.PORT || 5000;
	const server = http.createServer(app);

	// Socket.IO
	const io = new Server(server, {
		cors: {
			origin: process.env.FRONTEND_URL || 'http://localhost:3000',
			methods: ['GET', 'POST'],
			credentials: true
		}
	});

	// expose io on app for controllers
	app.set('io', io);

	io.on('connection', (socket) => {
		socket.on('join', ({ hostelId }) => {
			if (hostelId) socket.join(`hostel:${hostelId}`);
		});

		socket.on('leave', ({ hostelId }) => {
			if (hostelId) socket.leave(`hostel:${hostelId}`);
		});

		socket.on('disconnect', () => {});
	});

	server.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
		
		// Run startup tasks but don't let them crash the server
		updateFinesForOverdueBills().catch(err => {
			console.error('Error updating fines:', err.message);
		});
		autoResetDiets().catch(err => {
			console.error('Error auto-resetting diets:', err.message);
		});
		sendUpcomingPaymentReminders().catch(err => {
			console.error('Error sending reminders:', err.message);
		});
	});

	process.on('SIGTERM', () => {
		server.close(() => {
			process.exit(0);
		});
	});
});

// Import and start cron jobs
require('./scripts/cronJobs');

// Graceful shutdown
process.on('SIGTERM', () => {
	server.close(() => {
		process.exit(0);
	});
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

