const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const usersRouter = require('./routes/usersRouter');
const savingsGoalRouter = require('./routes/savingsGoalRouter');

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

const startServer = async () => {
	try {
		if (!MONGO_URI) {
			throw new Error('MONGO_URI is not set. Add it to Backend/.env');
		}

		await mongoose.connect(MONGO_URI);
		console.log('MongoDB connected successfully');

		app.listen(PORT, () => {
			console.log(`Server is running on http://localhost:${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start server:', error.message);
		process.exit(1);
	}
};

startServer();
