const express = require('express');
const cors = require('cors');
const chartsRouter = require('./routes/charts');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/charts', chartsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Chart Generator API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to generate charts with AI!`);
});

module.exports = app;