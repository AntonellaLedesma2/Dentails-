export {};
const mysql = require('mysql2/promise');
const fs = require('node:fs');

const sslEnabled = /^(1|true|yes)$/i.test(process.env.DB_SSL || '');
const sslCaPath = process.env.DB_SSL_CA;
const ssl = sslEnabled
  ? {
      rejectUnauthorized: true,
      ...(sslCaPath ? { ca: fs.readFileSync(sslCaPath, 'utf8') } : {}),
    }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dentalis',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
  ...(ssl ? { ssl } : {}),
});

// Verificar conexión al iniciar
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
