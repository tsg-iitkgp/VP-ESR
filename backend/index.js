import { configDotenv } from 'dotenv';
import app from './app.js';
import connectDb from './connectDb.js';

configDotenv();

const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'AUTH_SERVER_URL',
];
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`${key} is required`);
  }
}

const port = Number(process.env.PORT);

const startServer = async () => {
  await connectDb();
  app.listen(port, () => {
    console.log(`Listening on PORT ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
