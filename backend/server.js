require('dotenv').config();
require('./src/config/db'); // Inicia y verifica la conexión a la DB

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes         = require('./src/routes/auth.routes');
const usersRoutes        = require('./src/routes/users.routes');
const patientsRoutes     = require('./src/routes/patients.routes');
const appointmentsRoutes = require('./src/routes/appointments.routes');
const { errorHandler, notFound } = require('./src/middlewares/error.middleware');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globales ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'API DENTALIS funcionando',
    version: '1.0.0',
    endpoints: {
      auth:     '/api/auth',
      users:    '/api/users',
      patients: '/api/patients',
    },
  });
});

app.use('/api/auth',         authRoutes);
app.use('/api/users',        usersRoutes);
app.use('/api/patients',     patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);

// ─── Manejo de errores ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Inicio del servidor ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
