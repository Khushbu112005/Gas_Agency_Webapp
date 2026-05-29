import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'gas_agency_db',
  DB_PORT = 3306
} = process.env;

let pool;

export async function initializeDatabase() {
  try {
    // 1. First, connect to MySQL server without database to ensure it exists
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: parseInt(DB_PORT)
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    await connection.end();

    // 2. Initialize pool with database selected
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: parseInt(DB_PORT),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL database: ${DB_NAME}`);

    // 3. Create tables
    await createTables();

    // 4. Seed default users
    await seedUsers();

  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

async function createTables() {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      passwordHash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'client',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    // Bookings table
    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT NOT NULL,
      address TEXT NOT NULL,
      cylinderType VARCHAR(50) NOT NULL,
      date VARCHAR(50) NOT NULL,
      extra TINYINT(1) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      paymentStatus VARCHAR(50) DEFAULT 'unpaid',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,
    // Notices table
    `CREATE TABLE IF NOT EXISTS notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const query of queries) {
    await pool.query(query);
  }
  console.log('Database tables verified/created successfully.');
}

async function seedUsers() {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (rows[0].count === 0) {
    console.log('Seeding default admin and client accounts...');
    
    // Hash admin password
    const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);
    // Hash client password
    const clientPasswordHash = await bcrypt.hash('clientpassword', 10);

    // Insert Admin
    await pool.query(
      'INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, ?)',
      ['Agency Admin', 'admin@gmail.com', adminPasswordHash, 'admin']
    );

    // Insert Client
    await pool.query(
      'INSERT INTO users (name, email, passwordHash, role) VALUES (?, ?, ?, ?)',
      ['John Doe', 'client@gmail.com', clientPasswordHash, 'client']
    );

    console.log('Admin account (admin@gmail.com / Admin@1234) seeded successfully.');
    console.log('Client account (client@gmail.com / clientpassword) seeded successfully.');
  }
}

// Helper query function
export async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool.query(sql, params);
}
