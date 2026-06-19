const express = require('express');
const path = require('path');
const fs = require('fs');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

// DB setup
const dbPath = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
const adapter = new FileSync(path.join(dbPath, 'patients.json'));
const db = low(adapter);
db.defaults({ patients: [] }).write();

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Save patient plan
app.post('/api/patients', (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'No data' });
    const id = nanoid(8);
    db.get('patients').push({ id, data, createdAt: new Date().toISOString() }).write();
    res.json({ id, url: '/p/' + id });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Get patient plan
app.get('/api/patients/:id', (req, res) => {
  const patient = db.get('patients').find({ id: req.params.id }).value();
  if (!patient) return res.status(404).json({ error: 'No encontrado' });
  res.json(patient);
});

// List patients (editor only)
app.get('/api/patients', (req, res) => {
  const patients = db.get('patients').value().map(p => ({
    id: p.id,
    name: p.data?.patient?.name || 'Sin nombre',
    dx: p.data?.patient?.dx || '',
    createdAt: p.createdAt
  }));
  res.json(patients.reverse());
});

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  db.get('patients').remove({ id: req.params.id }).write();
  res.json({ ok: true });
});

// Patient view route
app.get('/p/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'patient.html'));
});

// Editor route
app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'editor.html'));
});

app.listen(PORT, () => console.log('Server running on port ' + PORT));
