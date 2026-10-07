import express from 'express';
import { exchangeCode, devLogin } from '../controllers/auth.controller.js';

const router = express.Router();

// Exchange authorization code for token
router.post('/callback', exchangeCode);

// Development bypass login
router.post('/dev-login', devLogin);

export default router;
