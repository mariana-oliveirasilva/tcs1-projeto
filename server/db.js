import mysql from 'mysql2/promise';

export function conectarBanco(env = process.env) {
  if (!env.DB_USER || !env.DB_PASSWORD || !env.DB_NAME) {
    throw new Error('Preencha DB_USER, DB_PASSWORD e DB_NAME no arquivo .env.');
  }

  return mysql.createPool({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    charset: 'utf8mb4',
    timezone: 'Z',
    connectionLimit: 10,
  });
}
