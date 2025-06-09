CREATE TABLE IF NOT EXISTS "posts" (
    "src" TEXT NOT NULL UNIQUE,
    "id" INTEGER,
    "uploader" TEXT NOT NULL,
    "date" TIMESTAMP,
    "score" INTEGER DEFAULT 0,
    "voters" TEXT,
    "rating" VARCHAR(20) DEFAULT 'general' CHECK("rating" IN ('general', 'sensitive', 'questionable', 'explicit')),
    "tags" TEXT,
    "deleted" BOOL DEFAULT 0 CHECK("deleted" IN (0, 1)),
    "source" TEXT,
    PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE IF NOT EXISTS users (
    "id" INTEGER,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "user_groups" TEXT,
    "deleted" BOOL DEFAULT 0 CHECK("deleted" IN (0,1)),
    PRIMARY KEY("id" AUTOINCREMENT)
);