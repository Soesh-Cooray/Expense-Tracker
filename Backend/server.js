const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const usersRouter = require('./routes/usersRouter');
const savingsGoalRouter = require('./routes/savingsGoalRouter');
const subscriptionRouter = require('./routes/subscriptionRouter');
const expensesRouter = require('./routes/expensesRouter');
const incomeRouter = require('./routes/incomeRouter');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.json({ message: 'Backend is running' });
});

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

app.use('/api/users', usersRouter);
app.use('/api/savings-goals', savingsGoalRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/income', incomeRouter);

const startServer = async () => {
	try {
		if (!MONGO_URI) {
			throw new Error('MONGO_URI is not set. Add it to Backend/.env');
		}

		await mongoose.connect(MONGO_URI);
		console.log('MongoDB connected successfully');

		const server = app.listen(PORT, '0.0.0.0', () => {
			console.log(`Server is running on http://localhost:${PORT}`);
		});

		server.on('error', (err) => {
			if (err.code === 'EADDRINUSE') {
				console.error(`Port ${PORT} is already in use`);
			} else {
				console.error('Server error:', err);
			}
			process.exit(1);
		});
	} catch (error) {
		console.error('Failed to start server:', error.message);
		process.exit(1);
	}
};

startServer();
