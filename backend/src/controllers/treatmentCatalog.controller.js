const TreatmentCatalogModel = require('../models/treatmentCatalog.model');

async function getCatalog(req, res, next) {
  try {
    const items = await TreatmentCatalogModel.findAll({ includeInactive: req.user.rol === 'administrador' });
    return res.status(200).json({ treatments: items });
  } catch (err) { next(err); }
}

async function createCatalogItem(req, res, next) {
  try {
    const id = await TreatmentCatalogModel.create(req.body);
    return res.status(201).json({ message: 'Tratamiento agregado al catálogo', id });
  } catch (err) { next(err); }
}

async function updateCatalogItem(req, res, next) {
  try {
    const updated = await TreatmentCatalogModel.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: true, message: 'Tratamiento no encontrado' });
    return res.status(200).json({ message: 'Precio actualizado' });
  } catch (err) { next(err); }
}

module.exports = { getCatalog, createCatalogItem, updateCatalogItem };
