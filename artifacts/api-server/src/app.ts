import express, { type Express } from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import trackRouter from './routes/track.js';
import adminRouter from './routes/admin.js';
import facebookRouter from './routes/facebook.js';

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use('/api/healthz', healthRouter);
app.use('/api/track', trackRouter);
app.use('/api/admin', adminRouter);
app.use('/api/facebook', facebookRouter);

export default app;
