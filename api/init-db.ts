import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables first
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('📦 Initializing PostgreSQL database...');
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'collectibles_db';
    try {
      await client.query(`CREATE DATABASE ${dbName};`);
      console.log(`✅ Database '${dbName}' created`);
    } catch (err: any) {
      if (err.code === '42P04') {
        console.log(`✅ Database '${dbName}' already exists`);
      } else {
        throw err;
      }
    }
    
    client.release();
    
    // Connect to the new database
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });
    
    const appClient = await appPool.connect();
    try {
      // Read and execute schema
      const schemaPath = path.join(process.cwd(), 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      await appClient.query(schema);
      console.log('✅ Database schema created');
      
      // Seed initial data
      await seedInitialData(appClient);
      console.log('✅ Initial data seeded');
      
      console.log('\n✨ Database initialization complete!');
      console.log('📊 Tables created: users, artworks, holdings, offers, transactions, escrow, artist_royalties, admin_events\n');
      
    } finally {
      appClient.release();
      await appPool.end();
    }
  } finally {
    await pool.end();
  }
}

async function seedInitialData(client: any) {
  // Seed artwork data
  const artworks = [
    {
      token: 'harmattan',
      name: 'Harmattan Haze',
      artist: 'Emeka Osei',
      category: 'Painting',
      city: 'Lagos',
      year: 2023,
      price: 480000,
      image: '/src/assets/art-1.jpg',
      description: 'A mesmerizing portrayal of the harmattan winds across the Sahel.',
      unique_id: 'ART-HARMATTAN-001',
    },
    {
      token: 'lagoon',
      name: 'Blue Lagoon Weave',
      artist: 'Fatima Diallo',
      category: 'Textile',
      city: 'Dakar',
      year: 2024,
      price: 210000,
      image: '/src/assets/art-2.jpg',
      description: 'Woven textile inspired by coastal waters and traditional patterns.',
      unique_id: 'ART-LAGOON-001',
    },
    {
      token: 'bronze',
      name: 'Mother of Ife',
      artist: 'Kwame Asante',
      category: 'Sculpture',
      city: 'Accra',
      year: 2022,
      price: 650000,
      image: '/src/assets/art-3.jpg',
      description: 'Bronze sculpture celebrating West African maternal figures.',
      unique_id: 'ART-BRONZE-001',
    },
    {
      token: 'mask',
      name: 'Earth Rhythm III',
      artist: 'Adunni Bello',
      category: 'Beadwork',
      city: 'Ibadan',
      year: 2024,
      price: 320000,
      image: '/src/assets/art-4.jpg',
      description: 'Intricate beadwork capturing the essence of traditional masks.',
      unique_id: 'ART-MASK-001',
    },
  ];

  for (const art of artworks) {
    await client.query(
      `INSERT INTO artworks (token, name, artist, category, city, year, price, image, description, unique_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (token) DO NOTHING`,
      [art.token, art.name, art.artist, art.category, art.city, art.year, art.price, art.image, art.description, art.unique_id]
    );
  }
}

// Run initialization
initializeDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
