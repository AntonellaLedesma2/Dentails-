require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

const demoPassword = 'DentalisDemo123!';
const dentists = [
  ['Ana', 'Benítez', 'ana.benitez@dentalis.test', 'demo.ana'],
  ['Mateo', 'Gómez', 'mateo.gomez@dentalis.test', 'demo.mateo'],
  ['Lucía', 'Rojas', 'lucia.rojas@dentalis.test', 'demo.lucia'],
  ['Nicolás', 'Vera', 'nicolas.vera@dentalis.test', 'demo.nicolas'],
];
const receptionist = ['Sofía', 'Duarte', 'recepcion.demo@dentalis.test', 'demo.recepcion'];
const patients = [
  ['Valentina', 'Acosta', 'F', '0971000001'], ['Thiago', 'Almirón', 'M', '0971000002'],
  ['Camila', 'Ayala', 'F', '0971000003'], ['Benjamín', 'Cabrera', 'M', '0971000004'],
  ['Mía', 'Cantero', 'F', '0971000005'], ['Joaquín', 'Cardozo', 'M', '0971000006'],
  ['Renata', 'Franco', 'F', '0971000007'], ['Gael', 'Giménez', 'M', '0971000008'],
  ['Emma', 'López', 'F', '0971000009'], ['Bautista', 'Martínez', 'M', '0971000010'],
  ['Zoe', 'Mendoza', 'F', '0971000011'], ['Dylan', 'Ortiz', 'M', '0971000012'],
  ['Abril', 'Pereira', 'F', '0971000013'], ['Lautaro', 'Ramírez', 'M', '0971000014'],
  ['Julieta', 'Villalba', 'F', '0971000015'],
  ['Sofía', 'Benítez', 'F', '0971000016'], ['Tobías', 'Cáceres', 'M', '0971000017'],
  ['Martina', 'Duarte', 'F', '0971000018'], ['Franco', 'Escobar', 'M', '0971000019'],
  ['Olivia', 'Fernández', 'F', '0971000020'], ['Matías', 'Galeano', 'M', '0971000021'],
  ['Catalina', 'Herrera', 'F', '0971000022'], ['Iñaki', 'Ibarra', 'M', '0971000023'],
  ['Alma', 'Jiménez', 'F', '0971000024'], ['Felipe', 'Leiva', 'M', '0971000025'],
  ['Isabella', 'Medina', 'F', '0971000026'], ['Bruno', 'Núñez', 'M', '0971000027'],
  ['Josefina', 'Acosta', 'F', '0971000028'], ['Tomás', 'Benítez', 'M', '0971000029'],
  ['Amparo', 'Caballero', 'F', '0971000030'],
  ['Mora', 'Castro', 'F', '0971000031'], ['Santiago', 'Domínguez', 'M', '0971000032'],
  ['Emilia', 'Estigarribia', 'F', '0971000033'], ['Facundo', 'Flores', 'M', '0971000034'],
  ['Pilar', 'González', 'F', '0971000035'], ['Benicio', 'Insfrán', 'M', '0971000036'],
  ['Clara', 'Lezcano', 'F', '0971000037'], ['Julián', 'Maidana', 'M', '0971000038'],
  ['Lola', 'Morínigo', 'F', '0971000039'], ['Dante', 'Ocampos', 'M', '0971000040'],
  ['Renata', 'Páez', 'F', '0971000041'], ['Valentino', 'Quiñónez', 'M', '0971000042'],
  ['Aitana', 'Recalde', 'F', '0971000043'], ['Máximo', 'Sosa', 'M', '0971000044'],
  ['Maia', 'Torres', 'F', '0971000045'],
  ['Agustina', 'Vázquez', 'F', '0971000046'], ['Lorenzo', 'Zárate', 'M', '0971000047'],
  ['Bianca', 'Arce', 'F', '0971000048'], ['Pedro', 'Brítez', 'M', '0971000049'],
  ['Delfina', 'Cáceres', 'F', '0971000050'], ['Simón', 'Delgado', 'M', '0971000051'],
  ['Malena', 'Espínola', 'F', '0971000052'], ['Ramiro', 'Franco', 'M', '0971000053'],
  ['Luz', 'Giménez', 'F', '0971000054'], ['Joaquín', 'López', 'M', '0971000055'],
  ['Victoria', 'Méndez', 'F', '0971000056'], ['Alejo', 'Noguera', 'M', '0971000057'],
  ['Guadalupe', 'Ríos', 'F', '0971000058'], ['Ignacio', 'Servín', 'M', '0971000059'],
  ['Carolina', 'Vera', 'F', '0971000060'],
];
const catalog = [
  ['Consulta odontológica', 'Consulta', 'Evaluación clínica inicial', 80000, 30],
  ['Limpieza dental', 'Prevención', 'Profilaxis y control preventivo', 120000, 40],
  ['Restauración simple', 'Operatoria', 'Restauración de una superficie', 180000, 45],
  ['Restauración compuesta', 'Operatoria', 'Restauración de varias superficies', 260000, 60],
  ['Tratamiento de conducto', 'Endodoncia', 'Tratamiento endodóntico', 650000, 90],
  ['Extracción simple', 'Cirugía', 'Exodoncia de pieza erupcionada', 220000, 45],
  ['Corona provisoria', 'Rehabilitación', 'Corona de protección provisoria', 350000, 60],
  ['Radiografía periapical', 'Diagnóstico', 'Estudio radiográfico periapical', 50000, 15],
];
const procedures = [
  ['Restauración de pieza posterior', 'Caries oclusal en pieza posterior.', 'Restauración con resina compuesta.'],
  ['Control y profilaxis', 'Gingivitis leve localizada.', 'Profilaxis y refuerzo de higiene oral.'],
  ['Evaluación endodóntica', 'Sensibilidad pulpar en pieza posterior.', 'Se solicita radiografía y control clínico.'],
  ['Seguimiento de tratamiento', 'Evolución favorable de la pieza tratada.', 'Continuar cuidados e higiene.'],
];

function dateOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function findOrCreateUser(connection, data, role, passwordHash) {
  const [nombre, apellido, correo, username] = data;
  await connection.execute(
    `INSERT INTO usuarios (nombre, apellido, correo, username, password_hash, rol, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'activo')
     ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), apellido = VALUES(apellido),
       rol = VALUES(rol), estado = 'activo'`,
    [nombre, apellido, correo, username, passwordHash, role]
  );
  const [[user]] = await connection.execute('SELECT id FROM usuarios WHERE correo = ?', [correo]);
  return user.id;
}

async function main() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      'ALTER TABLE fichas_clinicas ADD COLUMN IF NOT EXISTS odontograma LONGTEXT NULL AFTER observaciones'
    );
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS catalogo_tratamientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(160) NOT NULL UNIQUE,
        categoria VARCHAR(80) NOT NULL DEFAULT 'General',
        descripcion VARCHAR(255),
        precio DECIMAL(12, 2) NOT NULL DEFAULT 0,
        duracion_min INT NOT NULL DEFAULT 30,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    const passwordHash = bcrypt.hashSync(demoPassword, 10);
    const dentistIds = [];
    for (const dentist of dentists) dentistIds.push(await findOrCreateUser(connection, dentist, 'odontologo', passwordHash));
    const receptionistId = await findOrCreateUser(connection, receptionist, 'recepcion', passwordHash);

    for (const [nombre, categoria, descripcion, precio, duracion] of catalog) {
      await connection.execute(
        `INSERT INTO catalogo_tratamientos (nombre, categoria, descripcion, precio, duracion_min)
         VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE categoria = VALUES(categoria),
         descripcion = VALUES(descripcion), precio = VALUES(precio), duracion_min = VALUES(duracion_min), activo = 1`,
        [nombre, categoria, descripcion, precio, duracion]
      );
    }

    for (let i = 0; i < patients.length; i += 1) {
      const [nombre, apellido, sexo, telefono] = patients[i];
      const dni = `99000${String(i + 1).padStart(3, '0')}`;
      const correo = `paciente${String(i + 1).padStart(2, '0')}@example.test`;
      const odontologoId = dentistIds[i % dentistIds.length];
      await connection.execute(
        `INSERT INTO pacientes (nombre, apellido, dni, fecha_nacimiento, sexo, telefono, correo, obra_social, creado_por)
         VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), apellido = VALUES(apellido), telefono = VALUES(telefono)`,
        [nombre, apellido, dni, 8000 + (i * 173) % 12000, sexo === 'F' ? 'femenino' : 'masculino', telefono, correo,
          i % 3 === 0 ? 'Plan familiar demo' : 'Cobertura demo', receptionistId]
      );
      const [[patient]] = await connection.execute('SELECT id FROM pacientes WHERE dni = ?', [dni]);

      const odontogram = {
        16: i % 2 === 0 ? 'evaluado' : 'sano',
        26: i % 3 === 0 ? 'en_curso' : 'sano',
        36: i % 4 === 0 ? 'completado' : 'evaluado',
        46: i % 5 === 0 ? 'extraccion' : 'sano',
      };
      await connection.execute(
        `INSERT INTO fichas_clinicas (paciente_id, antecedentes, alergias, medicacion, observaciones, odontograma)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE odontograma = IF(odontograma IS NULL OR odontograma = '', VALUES(odontograma), odontograma)`,
        [patient.id, 'Registro ficticio de demostración. Confirmar antecedentes en una consulta real.',
          i % 7 === 0 ? 'Alergia estacional (dato de demostración)' : 'Sin alergias informadas en demo',
          'Sin medicación registrada en demo', 'Paciente de prueba; información clínica ficticia.', JSON.stringify(odontogram)]
      );

      const pastDate = dateOffset(-(i + 2));
      const futureDate = dateOffset(i + 1);
      const pastHour = `${String(8 + (i % 8)).padStart(2, '0')}:00:00`;
      const futureHour = `${String(8 + ((i + 3) % 8)).padStart(2, '0')}:00:00`;
      const appointmentSpecs = [
        [pastDate, pastHour, 'realizado', 'Control odontológico de demostración'],
        [futureDate, futureHour, i % 2 === 0 ? 'confirmado' : 'pendiente', 'Control programado de demostración'],
      ];
      for (const [fecha, hora, estado, motivo] of appointmentSpecs) {
        await connection.execute(
          `INSERT INTO turnos (paciente_id, odontologo_id, fecha, hora, duracion_min, motivo, estado, creado_por)
           SELECT ?, ?, ?, ?, 45, ?, ?, ? FROM DUAL
           WHERE NOT EXISTS (SELECT 1 FROM turnos WHERE paciente_id = ? AND fecha = ? AND hora = ? AND odontologo_id = ?)`,
          [patient.id, odontologoId, fecha, hora, motivo, estado, receptionistId, patient.id, fecha, hora, odontologoId]
        );
      }
      const [[pastAppointment]] = await connection.execute(
        'SELECT id FROM turnos WHERE paciente_id = ? AND odontologo_id = ? AND fecha = ? AND hora = ? LIMIT 1',
        [patient.id, odontologoId, pastDate, pastHour]
      );
      const [[record]] = await connection.execute('SELECT id FROM fichas_clinicas WHERE paciente_id = ?', [patient.id]);
      const [existingConsultation] = await connection.execute('SELECT id FROM consultas WHERE turno_id = ? LIMIT 1', [pastAppointment.id]);
      if (!existingConsultation.length) {
        const procedure = procedures[i % procedures.length];
        await connection.execute(
          `INSERT INTO consultas (ficha_id, turno_id, odontologo_id, fecha, diagnostico, procedimiento, indicaciones)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [record.id, pastAppointment.id, odontologoId, `${pastDate} ${pastHour}`, procedure[1], procedure[2],
            `${procedure[0]}. Nota ficticia para pruebas; no corresponde a un paciente real.`]
        );
      }

      const [treatment] = await connection.execute(
        'SELECT id FROM tratamientos WHERE paciente_id = ? AND odontologo_id = ? LIMIT 1',
        [patient.id, odontologoId]
      );
      let treatmentId = treatment[0]?.id;
      const price = catalog[i % catalog.length][3];
      if (!treatmentId) {
        const [created] = await connection.execute(
          `INSERT INTO tratamientos (paciente_id, odontologo_id, descripcion, estado, costo_total, notas)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [patient.id, odontologoId, catalog[i % catalog.length][0], i % 3 === 0 ? 'en_curso' : 'planificado', price,
            'Plan de ejemplo generado con datos ficticios.']
        );
        treatmentId = created.insertId;
      }
      const [payment] = await connection.execute('SELECT id FROM pagos WHERE tratamiento_id = ? LIMIT 1', [treatmentId]);
      if (!payment.length) {
        await connection.execute(
          `INSERT INTO pagos (paciente_id, tratamiento_id, importe, metodo, referencia, registrado_por)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [patient.id, treatmentId, Math.round(price * (i % 2 === 0 ? 0.5 : 0.3)),
            ['efectivo', 'transferencia', 'tarjeta_debito'][i % 3], `DEMO-${String(i + 1).padStart(3, '0')}`, receptionistId]
        );
      }
    }

    await connection.commit();
    console.log('Datos ficticios cargados: 60 pacientes (15 por odontólogo), 4 odontólogos, una recepción, citas pasadas y futuras, fichas, odontogramas, tratamientos y pagos.');
    console.log(`Contraseña común de las cuentas demo: ${demoPassword}`);
    console.log('Cuentas odontólogo: ana.benitez@dentalis.test, mateo.gomez@dentalis.test, lucia.rojas@dentalis.test, nicolas.vera@dentalis.test');
    console.log('Cuenta recepción: recepcion.demo@dentalis.test');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('No se pudieron cargar los datos demo:', error.message);
  process.exitCode = 1;
});
