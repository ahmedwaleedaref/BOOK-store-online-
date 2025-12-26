const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');
const { body } = require('express-validator');

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/publishers', adminController.getAllPublishers);
router.get('/publishers/:id', validateId, adminController.getPublisherById);

router.post(
  '/publishers',
  [
    body('publisher_name')
      .trim()
      .notEmpty()
      .withMessage('Publisher name is required')
      .isLength({ max: 200 })
  ],
  adminController.addPublisher
);

router.put('/publishers/:id', validateId, adminController.updatePublisher);
router.delete('/publishers/:id', validateId, adminController.deletePublisher);

router.get('/authors', adminController.getAllAuthors);
router.get('/authors/:id', validateId, adminController.getAuthorById);

router.post(
  '/authors',
  [
    body('author_name')
      .trim()
      .notEmpty()
      .withMessage('Author name is required')
      .isLength({ max: 200 })
  ],
  adminController.addAuthor
);

router.put('/authors/:id', validateId, adminController.updateAuthor);
router.delete('/authors/:id', validateId, adminController.deleteAuthor);

module.exports = router;
