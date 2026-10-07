import express from 'express';
import { exchangeCode } from '../controllers/auth.controller.js';

const router = express.Router();

// Exchange authorization code for token
router.post('/callback', exchangeCode);

export default router;
