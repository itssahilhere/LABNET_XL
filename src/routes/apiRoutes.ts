import express, { Request, Response } from 'express';
import { ApiController } from '../controllers/ApiController';
import { authenticateToken } from '../middleware/validation';
import { validateProductCreation, validateProductUpdate } from '../middleware/productValidation';

const router = express.Router();
const apiController = new ApiController();

router.use(authenticateToken);

// POST /api/add_product - Create new product
router.post('/add_product', 
  validateProductCreation,
  (req: Request, res: Response) => apiController.store(req, res)
);

// GET /api/products - Get all products for authenticated user
router.get('/products', 
  (req: Request, res: Response) => apiController.index(req, res)
);

// GET /api/products/:id - Get single product by ID or PID
router.get('/products/:id', 
  (req: Request, res: Response) => apiController.show(req, res)
);

// PUT /api/products/:id - Update product
router.put('/update_product/:id', 
  validateProductUpdate,
  (req: Request, res: Response) => apiController.update(req, res)
);
router.delete('/delete_product/:id', 
  (req: Request, res: Response) => apiController.destroy(req, res)
);

// Package Routes
// GET /api/packages - Get all active packages
router.get('/packages', 
  (req: Request, res: Response) => apiController.packages(req, res)
);

// POST /api/buy_package - Buy a package (create Stripe checkout)
router.post('/buy_package', 
  (req: Request, res: Response) => apiController.buy_package(req, res)
);

// GET /api/package_history - Get user's package history
router.get('/package_history', 
  (req: Request, res: Response) => apiController.package_history(req, res)
);

export default router;