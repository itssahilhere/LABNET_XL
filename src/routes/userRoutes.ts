import express, { Request, Response } from 'express';
import { UserController } from '../controllers/UserController.js';
import { validateRegistration, validateLogin, authenticateToken } from '../middleware/validation.js';

const router = express.Router();
const userController = new UserController();

// Public routes
router.post('/register', 
  validateRegistration, 
  (req: Request, res: Response) => userController.register(req, res)
);

router.post('/login', 
  validateLogin, 
  (req: Request, res: Response) => userController.login(req, res)
);

// Protected routes (require authentication)
router.get('/profile', 
  authenticateToken, 
  (req: Request, res: Response) => userController.getProfile(req, res)
);

router.put('/profile', 
  authenticateToken, 
  (req: Request, res: Response) => userController.updateProfile(req, res)
);

// Dashboard routes
router.get('/dashboard', 
  authenticateToken, 
  (req: Request, res: Response) => userController.getDashboard(req, res)
);

router.get('/dashboard/products/stats', 
  authenticateToken, 
  (req: Request, res: Response) => userController.getProductStats(req, res)
);


export default router;
