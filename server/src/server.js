require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const startReminderSchedule = require('./config/scheduler');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // In development (incl. the ephemeral in-memory DB fallback), (re)seed
  // demo data so the frontend has listings to show. seed() is idempotent:
  // it exits early when the demo admin already exists, so persistent
  // databases are never duplicated.
  if (process.env.NODE_ENV !== 'production') {
    const { seed } = require('../scripts/seed');
    await seed();
  }

  const server = app.listen(PORT, () => {
    console.log(`BorrowBox API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  startReminderSchedule();

  // Fail loudly instead of leaving the process in a broken state.
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
