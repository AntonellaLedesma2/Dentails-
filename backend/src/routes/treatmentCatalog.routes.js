const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { getCatalog, createCatalogItem, updateCatalogItem } = require('../controllers/treatmentCatalog.controller');

const router = express.Router();
router.use(authenticate);
router.get('/', authorize('administrador', 'odontologo'), getCatalog);
router.post('/', authorize('administrador'), [
  body('nombre').trim().notEmpty(),
  body('precio').isFloat({ min: 0 }),
], validate, createCatalogItem);
router.patch('/:id', authorize('administrador'), [
  body('nombre').optional().trim().notEmpty(),
  body('precio').optional().isFloat({ min: 0 }),
  body('activo').optional().isBoolean(),
], validate, updateCatalogItem);

module.exports = router;
