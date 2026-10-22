const express = require('express');
const router  = express.Router();
const { getRecord, updateRecord, addConsulta, saveOdontograma } = require('../controllers/clinicalRecords.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/:pacienteId',             authorize('odontologo','administrador'), getRecord);
router.put('/:pacienteId',             authorize('odontologo'), updateRecord);
router.post('/:pacienteId/consultas',  authorize('odontologo'), addConsulta);
router.put('/:pacienteId/odontograma', authorize('odontologo'), saveOdontograma);

module.exports = router;
