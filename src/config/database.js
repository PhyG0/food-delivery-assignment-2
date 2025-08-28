const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', '..', 'database', 'ecommerce.db');
    }

    async connect() {
        return new Promise((resolve, reject) => {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    // Enable foreign keys
                    this.db.run('PRAGMA foreign_keys = ON');
                    resolve();
                }
            });
        });
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Execute query with parameters
    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Execute single query (INSERT, UPDATE, DELETE)
    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        changes: this.changes,
                        lastID: this.lastID
                    });
                }
            });
        });
    }

    // Get single row
    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Begin transaction
    async beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    // Commit transaction
    async commit() {
        return this.run('COMMIT');
    }

    // Rollback transaction
    async rollback() {
        return this.run('ROLLBACK');
    }

    // Initialize database schema
    async initializeSchema() {
        const schemaSQL = fs.readFileSync(
            path.join(__dirname, '..', '..', 'database', 'schema.sql'), 
            'utf8'
        );
        
        const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await this.run(statement);
            }
        }
        
        console.log('Database schema initialized');
    }
}

// Singleton instance
const database = new Database();

module.exports = database;