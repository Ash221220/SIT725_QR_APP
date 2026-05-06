// Purpose: Define menu-related API endpoints and map them to menu controller handlers.
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getOwnerMenu,
  getOwnerTables,
  getMenuByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menuController');

const router = express.Router();

// Owner: read own menu and tables
router.get('/my', protect, authorize('owner'), getOwnerMenu);
router.get('/my/tables', protect, authorize('owner'), getOwnerTables);

// Owner: create a new menu item
router.post('/my', protect, authorize('owner'), createMenuItem);

// Owner: update or delete a specific menu item
router.put('/my/:itemId', protect, authorize('owner'), updateMenuItem);
router.delete('/my/:itemId', protect, authorize('owner'), deleteMenuItem);

// Owner: toggle availability of a menu item
router.patch('/my/:itemId/availability', protect, authorize('owner'), toggleAvailability);

// Super-admin: view any restaurant's full menu
router.get('/:restaurantId', protect, authorize('super_admin'), getMenuByRestaurant);

module.exports = router;
