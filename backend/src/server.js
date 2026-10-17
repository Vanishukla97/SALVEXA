const app = require('./app');
const env = require('./config/env');
const { testConnection, runDbMigrations } = require('./config/db');
const { deliverDueNotifications } = require('./services/notificationService');

let serverInstance = null;
let notificationScheduler = null;

function logFatal(label, error) {
  // eslint-disable-next-line no-console
  console.error(`[${label}]`, error?.stack || error?.message || error);
}

process.on('unhandledRejection', (reason) => {
  logFatal('unhandledRejection', reason);
});

process.on('uncaughtException', (error) => {
  logFatal('uncaughtException', error);
  process.exit(1);
});

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`Received ${signal}. Shutting down backend...`);
  if (notificationScheduler) {
    clearInterval(notificationScheduler);
    notificationScheduler = null;
  }
  if (serverInstance) {
    serverInstance.close(() => {
      process.exit(0);
    });
    return;
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function bootstrap() {
  try {
    await testConnection();
    await runDbMigrations();
    notificationScheduler = setInterval(async () => {
      try {
        await deliverDueNotifications();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Notification scheduler error:', error.message);
      }
    }, 60 * 1000);

    serverInstance = app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${env.port}`);
    });
    serverInstance.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        // eslint-disable-next-line no-console
        console.error(
          `Port ${env.port} is already in use. Stop the existing process or change PORT in backend/.env.`
        );
      } else {
        // eslint-disable-next-line no-console
        console.error('Server startup error:', error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start backend:', error.message);
    process.exit(1);
  }
}

bootstrap();
