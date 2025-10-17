import express, { Request, Response } from 'express';
import { WebhookController } from '../controllers/WebhookController';

const router = express.Router();
const webhookController = new WebhookController();

router.post('/stripe', express.raw({ type: 'application/json' }), (req: Request, res: Response) =>
  webhookController.stripeWebhook(req, res)
);

export default router;
