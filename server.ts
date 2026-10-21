import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getInitialDemands, INITIAL_MEMBERS } from './src/services/sampleData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Persistent storage path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

interface DatabaseSchema {
  members: any[];
  demands: any[];
  updatedAt: string;
}

// Ensure data directory and database file exist
function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      members: INITIAL_MEMBERS,
      demands: getInitialDemands(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.members) || !Array.isArray(parsed.demands)) {
      throw new Error('Formato inválido do arquivo de banco de dados');
    }
    return parsed;
  } catch (err) {
    console.warn('Erro ao ler banco de dados existente, recriando inicial:', err);
    const fallback: DatabaseSchema = {
      members: INITIAL_MEMBERS,
      demands: getInitialDemands(),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

// Atomic write to prevent file corruption
function writeDatabase(data: DatabaseSchema): void {
  data.updatedAt = new Date().toISOString();
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

let db = initDatabase();

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // ===================== API ROUTES =====================

  // Health and Status
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/database/status', (_req, res) => {
    res.json({
      status: 'connected',
      type: 'persistent-json-server',
      membersCount: db.members.length,
      demandsCount: db.demands.length,
      updatedAt: db.updatedAt,
    });
  });

  // Team Members
  app.get('/api/team-members', (_req, res) => {
    res.json(db.members);
  });

  app.post('/api/team-members', (req, res) => {
    const member = req.body;
    if (!member || !member.id || !member.name) {
      return res.status(400).json({ error: 'Membro inválido' });
    }

    const idx = db.members.findIndex(m => m.id === member.id);
    if (idx >= 0) {
      db.members[idx] = { ...db.members[idx], ...member };
    } else {
      db.members.push(member);
    }
    writeDatabase(db);
    res.json({ success: true, member });
  });

  app.delete('/api/team-members/:id', (req, res) => {
    const { id } = req.params;
    db.members = db.members.filter(m => m.id !== id);
    writeDatabase(db);
    res.json({ success: true });
  });

  // Demands
  app.get('/api/demands', (_req, res) => {
    res.json(db.demands);
  });

  app.post('/api/demands', (req, res) => {
    const demand = req.body;
    if (!demand || !demand.id || !demand.title) {
      return res.status(400).json({ error: 'Demanda inválida' });
    }

    const nowIso = new Date().toISOString();
    const updatedDemand = {
      ...demand,
      updated_at: nowIso,
      completed_at: demand.status === 'Concluído' 
        ? (demand.completed_at || nowIso) 
        : (demand.status ? null : demand.completed_at),
    };

    const idx = db.demands.findIndex(d => d.id === demand.id);
    if (idx >= 0) {
      db.demands[idx] = updatedDemand;
    } else {
      db.demands.unshift(updatedDemand);
    }
    writeDatabase(db);
    res.json({ success: true, demand: updatedDemand });
  });

  app.patch('/api/demands/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }

    const target = db.demands.find(d => d.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Demanda não encontrada' });
    }

    const nowIso = new Date().toISOString();
    target.status = status;
    target.updated_at = nowIso;
    if (status === 'Concluído') {
      if (!target.completed_at) {
        target.completed_at = nowIso;
      }
    } else {
      target.completed_at = null;
    }

    writeDatabase(db);
    res.json({ success: true, demand: target });
  });

  app.delete('/api/demands/:id', (req, res) => {
    const { id } = req.params;
    db.demands = db.demands.filter(d => d.id !== id);
    writeDatabase(db);
    res.json({ success: true });
  });

  // Bulk sync from client (useful for migrating or re-syncing)
  app.post('/api/database/sync-from-client', (req, res) => {
    const { members, demands } = req.body;
    if (Array.isArray(members) && members.length > 0) {
      db.members = members;
    }
    if (Array.isArray(demands) && demands.length > 0) {
      db.demands = demands;
    }
    writeDatabase(db);
    res.json({
      success: true,
      membersCount: db.members.length,
      demandsCount: db.demands.length,
    });
  });

  // Reset database to initial sample data
  app.post('/api/database/reset', (_req, res) => {
    db = {
      members: INITIAL_MEMBERS,
      demands: getInitialDemands(),
      updatedAt: new Date().toISOString(),
    };
    writeDatabase(db);
    res.json({ success: true, message: 'Banco de dados restaurado aos padrões' });
  });

  // ===================== FRONTEND SERVING =====================

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor ComSoc DEC rodando em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
