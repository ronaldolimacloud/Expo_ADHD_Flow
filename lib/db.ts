import * as SQLite from 'expo-sqlite';
import { Project, Item } from './types';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initializeDatabase(): Promise<void> {
  if (db) return;
  
  try {
    db = await SQLite.openDatabaseAsync('brainpocket.db');
    
    // Create tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        description TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    // Create items table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        projectId TEXT,
        parentId TEXT,
        title TEXT NOT NULL,
        body TEXT,
        tags TEXT,
        links TEXT,
        status TEXT NOT NULL,
        priority INTEGER,
        energy TEXT,
        timeEstimateMin INTEGER,
        remindAt TEXT,
        source TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (projectId) REFERENCES projects (id),
        FOREIGN KEY (parentId) REFERENCES items (id)
      );
    `);

    // Migrate existing databases to include new columns
    await migrateDatabase();

    // Seed demo data
    await seedDemoData();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function migrateDatabase() {
  if (!db) return;
  try {
    // Ensure parentId exists on items table
    const columns = await db.getAllAsync('PRAGMA table_info(items)');
    const hasParentId = Array.isArray(columns) && (columns as any[]).some((c) => c.name === 'parentId');
    if (!hasParentId) {
      await db.execAsync('ALTER TABLE items ADD COLUMN parentId TEXT');
    }

    // Ensure description exists on projects table
    const projCols = await db.getAllAsync('PRAGMA table_info(projects)');
    const hasDescription = Array.isArray(projCols) && (projCols as any[]).some((c) => c.name === 'description');
    if (!hasDescription) {
      await db.execAsync('ALTER TABLE projects ADD COLUMN description TEXT');
    }
  } catch (err) {
    console.warn('Database migration skipped or failed:', err);
  }
}

async function getDbInstance(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  
  if (initPromise) {
    await initPromise;
  }
  
  return db;
}

async function seedDemoData() {
  if (!db) return;
  
  const existingProjects = await db.getFirstAsync('SELECT COUNT(*) as count FROM projects');
  if (existingProjects && (existingProjects as any).count > 0) {
    return; // Already seeded
  }

  const now = new Date().toISOString();
  
  // Create demo projects
  const projects: Project[] = [
    {
      id: 'project-1',
      name: 'Personal Website',
      color: '#3B82F6',
      createdAt: now,
    },
    {
      id: 'project-2',
      name: 'Mobile App Idea',
      color: '#10B981',
      createdAt: now,
    },
  ];

  for (const project of projects) {
    await db.runAsync(
      'INSERT INTO projects (id, name, color, description, createdAt) VALUES (?, ?, ?, ?, ?)',
      [project.id, project.name, project.color, null, project.createdAt]
    );
  }

  // Create demo items
  const items: Item[] = [
    {
      id: 'item-1',
      type: 'Task',
      projectId: 'project-1',
      title: 'Design homepage layout',
      body: 'Create wireframes and mockups for the main landing page',
      tags: ['design', 'frontend'],
      status: 'inbox',
      priority: 2,
      energy: 'med',
      timeEstimateMin: 120,
      source: 'text',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item-2',
      type: 'Idea',
      projectId: null,
      title: 'AI-powered note organization',
      body: 'Use machine learning to automatically categorize and tag notes',
      tags: ['ai', 'productivity'],
      status: 'inbox',
      energy: 'high',
      source: 'voice',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item-3',
      type: 'Link',
      projectId: 'project-2',
      title: 'React Native best practices',
      body: 'Comprehensive guide for mobile development',
      tags: ['development', 'mobile'],
      links: [
        {
          url: 'https://reactnative.dev/docs/getting-started',
          kind: 'web',
          title: 'React Native Documentation',
        },
      ],
      status: 'active',
      priority: 1,
      energy: 'low',
      timeEstimateMin: 30,
      source: 'paste',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item-4',
      type: 'Note',
      projectId: null,
      title: 'Meeting notes - Q1 planning',
      body: 'Key takeaways from quarterly planning session. Focus on user experience improvements.',
      tags: ['meeting', 'planning'],
      status: 'done',
      source: 'text',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'item-5',
      type: 'Project',
      projectId: null,
      title: 'Learn TypeScript',
      body: 'Complete TypeScript fundamentals course and build a sample project',
      tags: ['learning', 'typescript'],
      status: 'inbox',
      priority: 3,
      energy: 'high',
      timeEstimateMin: 480,
      source: 'text',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const item of items) {
    await db.runAsync(
      `INSERT INTO items (
        id, type, projectId, parentId, title, body, tags, links, status, priority, 
        energy, timeEstimateMin, remindAt, source, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.type,
        item.projectId,
        null,
        item.title,
        item.body,
        JSON.stringify(item.tags),
        JSON.stringify(item.links || []),
        item.status,
        item.priority,
        item.energy,
        item.timeEstimateMin,
        item.remindAt,
        item.source,
        item.createdAt,
        item.updatedAt,
      ]
    );
  }
}

export async function getProjects(): Promise<Project[]> {
  const database = await getDbInstance();
  const result = await database.getAllAsync('SELECT * FROM projects ORDER BY createdAt DESC');
  return result as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const database = await getDbInstance();
  const result = await database.getFirstAsync('SELECT * FROM projects WHERE id = ?', [id]);
  return result as Project | null;
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  const database = await getDbInstance();
  const now = new Date().toISOString();
  const id = `project-${Date.now()}`;
  const newProject: Project = {
    ...project,
    id,
    createdAt: now,
  };

  await database.runAsync(
    'INSERT INTO projects (id, name, color, description, createdAt) VALUES (?, ?, ?, ?, ?)',
    [newProject.id, newProject.name, newProject.color, newProject.description ?? null, newProject.createdAt]
  );

  return newProject;
}

export async function updateProject(id: string, updates: Partial<Pick<Project, 'name' | 'color' | 'description'>>): Promise<void> {
  const database = await getDbInstance();
  const allowedKeys: Array<keyof Project> = ['name', 'color', 'description'];
  const entries = Object.entries(updates).filter(([key, value]) => allowedKeys.includes(key as keyof Project) && value !== undefined);
  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value === null ? null : value);

  await database.runAsync(`UPDATE projects SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function getItems(status?: string, projectId?: string): Promise<Item[]> {
  const database = await getDbInstance();
  let query = 'SELECT * FROM items';
  const params: any[] = [];

  if (status || projectId) {
    query += ' WHERE';
    const conditions: string[] = [];
    
    if (status) {
      conditions.push(' status = ?');
      params.push(status);
    }
    
    if (projectId) {
      conditions.push(' projectId = ?');
      params.push(projectId);
    }
    
    query += conditions.join(' AND');
  }

  query += ' ORDER BY createdAt DESC';

  const result = await database.getAllAsync(query, params);
  return result.map((row: any) => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    links: JSON.parse(row.links || '[]'),
  })) as Item[];
}

export async function getItem(id: string): Promise<Item | null> {
  const database = await getDbInstance();
  const result = await database.getFirstAsync('SELECT * FROM items WHERE id = ?', [id]);
  if (!result) return null;
  
  const item = result as any;
  return {
    ...item,
    tags: JSON.parse(item.tags || '[]'),
    links: JSON.parse(item.links || '[]'),
  } as Item;
}

export async function createItem(item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
  const database = await getDbInstance();
  const now = new Date().toISOString();
  const id = `item-${Date.now()}`;
  
  // Handle YouTube URL enrichment
  let enrichedItem = { ...item };
  if (item.body && isYouTubeUrl(item.body)) {
    try {
      const videoTitle = await fetchYouTubeTitle(item.body);
      if (videoTitle) {
        enrichedItem.links = [
          {
            url: item.body,
            kind: 'youtube',
            title: videoTitle,
          },
        ];
        // If title is just "Link", replace with video title
        if (item.title === 'Link') {
          enrichedItem.title = videoTitle;
        }
      }
    } catch (error) {
      console.log('Failed to fetch YouTube title:', error);
      // Continue with original item if fetch fails
    }
  }
  
  const newItem: Item = {
    ...enrichedItem,
    id,
    createdAt: now,
    updatedAt: now,
  };

  await database.runAsync(
    `INSERT INTO items (
      id, type, projectId, parentId, title, body, tags, links, status, priority, 
      energy, timeEstimateMin, remindAt, source, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newItem.id,
      newItem.type,
      newItem.projectId,
      (newItem as any).parentId ?? null,
      newItem.title,
      newItem.body,
      JSON.stringify(newItem.tags),
      JSON.stringify(newItem.links || []),
      newItem.status,
      newItem.priority,
      newItem.energy,
      newItem.timeEstimateMin,
      newItem.remindAt,
      newItem.source,
      newItem.createdAt,
      newItem.updatedAt,
    ]
  );

  return newItem;
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<void> {
  const database = await getDbInstance();
  const now = new Date().toISOString();
  const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates).map(value => {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return value;
  });
  
  await database.runAsync(
    `UPDATE items SET ${setClause}, updatedAt = ? WHERE id = ?`,
    [...values, now, id]
  );
}

export async function searchItems(query: string): Promise<Item[]> {
  const database = await getDbInstance();
  const result = await database.getAllAsync(
    'SELECT * FROM items WHERE title LIKE ? OR body LIKE ? ORDER BY createdAt DESC',
    [`%${query}%`, `%${query}%`]
  );
  
  return result.map((row: any) => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    links: JSON.parse(row.links || '[]'),
  })) as Item[];
}

export async function deleteItem(id: string): Promise<void> {
  const database = await getDbInstance();
  await database.runAsync('DELETE FROM items WHERE id = ?', [id]);
}

export async function moveItemToProject(itemId: string, projectId: string | null): Promise<void> {
  const database = await getDbInstance();
  await database.runAsync('UPDATE items SET projectId = ?, updatedAt = ? WHERE id = ?', [
    projectId,
    new Date().toISOString(),
    itemId,
  ]);
}

export async function markItemDone(itemId: string): Promise<void> {
  const database = await getDbInstance();
  await database.runAsync('UPDATE items SET status = ?, updatedAt = ? WHERE id = ?', [
    'done',
    new Date().toISOString(),
    itemId,
  ]);
}

export async function pinItem(itemId: string): Promise<void> {
  const database = await getDbInstance();
  await database.runAsync('UPDATE items SET priority = 1, updatedAt = ? WHERE id = ?', [
    new Date().toISOString(),
    itemId,
  ]);
}

export async function deleteProject(projectId: string, options?: { deleteItems?: boolean }): Promise<void> {
  const database = await getDbInstance();
  const shouldDeleteItems = options?.deleteItems !== false; // default true
  if (shouldDeleteItems) {
    await database.runAsync('DELETE FROM items WHERE projectId = ?', [projectId]);
  } else {
    await database.runAsync('UPDATE items SET projectId = NULL, updatedAt = ? WHERE projectId = ?', [
      new Date().toISOString(),
      projectId,
    ]);
  }
  await database.runAsync('DELETE FROM projects WHERE id = ?', [projectId]);
}

function isYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/;
  return youtubeRegex.test(url);
}

async function fetchYouTubeTitle(url: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.title || null;
  } catch (error) {
    return null;
  }
}

export async function searchItemsWithFilters(filters: {
  query?: string;
  projectId?: string | null;
  type?: string;
  status?: string;
  energy?: string;
  tag?: string;
  parentId?: string | null;
}): Promise<Item[]> {
  const database = await getDbInstance();
  let query = 'SELECT * FROM items';
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters.query) {
    conditions.push('(title LIKE ? OR body LIKE ?)');
    params.push(`%${filters.query}%`, `%${filters.query}%`);
  }

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (filters.energy) {
    conditions.push('energy = ?');
    params.push(filters.energy);
  }

  if (filters.tag) {
    // tags stored as JSON array; LIKE match on serialized JSON
    conditions.push('tags LIKE ?');
    params.push(`%"${filters.tag}"%`);
  }

  if (filters.projectId !== undefined) {
    if (filters.projectId === null) {
      conditions.push('projectId IS NULL');
    } else {
      conditions.push('projectId = ?');
      params.push(filters.projectId);
    }
  }

  if (filters.parentId !== undefined) {
    if (filters.parentId === null) {
      conditions.push('parentId IS NULL');
    } else {
      conditions.push('parentId = ?');
      params.push(filters.parentId);
    }
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY createdAt DESC';

  const result = await database.getAllAsync(query, params);
  return result.map((row: any) => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    links: JSON.parse(row.links || '[]'),
  })) as Item[];
}

export { initializeDatabase };