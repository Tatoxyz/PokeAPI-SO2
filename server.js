// =====================================================================
//  TatOS Pokedex API - API REST (GET, POST, PUT, DELETE) sobre PostgreSQL
//  Sistema: TatOS (Linux From Scratch 12.4)
// =====================================================================
const express = require('express');
const os = require('os');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// La conexion usa las variables PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
const pool = new Pool();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const CAMPOS = ['numero', 'nombre', 'tipo_principal', 'tipo_secundario',
                'region', 'nivel', 'capturado'];

function leerID() {
  try { return fs.readFileSync('/etc/ID.txt', 'utf8').trim(); } catch { return 'desconocido'; }
}

function manejarError(res, err) {
  if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un Pokemon con ese numero' });
  if (err.code === '23514') return res.status(400).json({ error: 'El nivel debe estar entre 1 y 100' });
  if (err.code === '23502') return res.status(400).json({ error: 'Falta un campo obligatorio' });
  if (err.code === '22P02') return res.status(400).json({ error: 'Formato de dato invalido' });
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// Registro de cada solicitud en el log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ---------- Informacion general ----------
app.get('/api', (req, res) => {
  res.json({
    api: 'TatOS Pokedex API',
    version: '1.0.0',
    sistema: 'TatOS 12.4 (Linux From Scratch)',
    estudiante: leerID(),
    endpoints: {
      'GET    /api/salud':          'Estado del servidor y de la base de datos',
      'GET    /api/pokemon':        'Listar Pokemon (filtros: ?tipo=Agua&capturado=true)',
      'GET    /api/pokemon/:numero': 'Obtener un Pokemon por numero de Pokedex',
      'POST   /api/pokemon':        'Registrar un Pokemon',
      'PUT    /api/pokemon/:numero': 'Actualizar un Pokemon',
      'DELETE /api/pokemon/:numero': 'Eliminar un Pokemon'
    }
  });
});

// ---------- Salud: prueba la conexion con PostgreSQL ----------
app.get('/api/salud', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT current_database() AS base, current_user AS usuario, version() AS version, NOW() AS hora, (SELECT COUNT(*) FROM pokemon)::int AS total_pokemon'
    );
    res.json({
      estado: 'ok',
      servidor: os.hostname(),
      kernel: os.release(),
      node: process.version,
      base_de_datos: r.rows[0]
    });
  } catch (err) {
    res.status(503).json({ estado: 'error', detalle: err.message });
  }
});

// ---------- GET: listar ----------
app.get('/api/pokemon', async (req, res) => {
  const condiciones = [];
  const valores = [];
  if (req.query.tipo) {
    valores.push(req.query.tipo);
    condiciones.push(`(tipo_principal ILIKE $${valores.length} OR tipo_secundario ILIKE $${valores.length})`);
  }
  if (req.query.capturado !== undefined) {
    valores.push(req.query.capturado === 'true');
    condiciones.push(`capturado = $${valores.length}`);
  }
  const where = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';
  try {
    const r = await pool.query(`SELECT * FROM pokemon ${where} ORDER BY numero`, valores);
    res.json({ total: r.rowCount, pokemon: r.rows });
  } catch (err) { manejarError(res, err); }
});

// ---------- GET: uno ----------
app.get('/api/pokemon/:numero', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM pokemon WHERE numero = $1', [req.params.numero]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Pokemon no encontrado' });
    res.json(r.rows[0]);
  } catch (err) { manejarError(res, err); }
});

// ---------- POST: crear ----------
app.post('/api/pokemon', async (req, res) => {
  const p = req.body || {};
  if (!p.numero || !p.nombre || !p.tipo_principal) {
    return res.status(400).json({ error: 'Se requieren numero, nombre y tipo_principal' });
  }
  try {
    const r = await pool.query(
      `INSERT INTO pokemon (numero, nombre, tipo_principal, tipo_secundario, region, nivel, capturado)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 5), COALESCE($7, FALSE))
       RETURNING *`,
      [p.numero, p.nombre, p.tipo_principal, p.tipo_secundario ?? null,
       p.region ?? null, p.nivel ?? null, p.capturado ?? null]
    );
    res.status(201).json({ mensaje: 'Pokemon registrado', pokemon: r.rows[0] });
  } catch (err) { manejarError(res, err); }
});

// ---------- PUT: actualizar (solo los campos enviados) ----------
app.put('/api/pokemon/:numero', async (req, res) => {
  const p = req.body || {};
  const sets = [];
  const valores = [];
  for (const campo of CAMPOS) {
    if (p[campo] !== undefined) {
      valores.push(p[campo]);
      sets.push(`${campo} = $${valores.length}`);
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  valores.push(req.params.numero);
  try {
    const r = await pool.query(
      `UPDATE pokemon SET ${sets.join(', ')} WHERE numero = $${valores.length} RETURNING *`,
      valores
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Pokemon no encontrado' });
    res.json({ mensaje: 'Pokemon actualizado', pokemon: r.rows[0] });
  } catch (err) { manejarError(res, err); }
});

// ---------- DELETE: eliminar ----------
app.delete('/api/pokemon/:numero', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM pokemon WHERE numero = $1 RETURNING *', [req.params.numero]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Pokemon no encontrado' });
    res.json({ mensaje: 'Pokemon eliminado', pokemon: r.rows[0] });
  } catch (err) { manejarError(res, err); }
});

// ---------- Ruta no encontrada ----------
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, HOST, () => {
  console.log(`TatOS Pokedex API escuchando en http://${HOST}:${PORT} (estudiante ${leerID()})`);
});
