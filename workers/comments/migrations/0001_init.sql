-- comentarios anónimos por hilo; el borrado es lógico para poder revisar abusos
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  thread TEXT NOT NULL,
  parent_id TEXT REFERENCES comments (id),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  is_author INTEGER NOT NULL DEFAULT 0,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX comments_thread_created ON comments (thread, created_at);
CREATE INDEX comments_ip_created ON comments (ip_hash, created_at);
