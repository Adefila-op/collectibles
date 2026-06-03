import pg from 'pg';
const { Client } = pg;

async function setupTestData() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'collectibles_db',
    password: 'Adefila111',
    port: 5432,
  });

  try {
    await client.connect();

    console.log('=== Setting Up Test Data ===\n');

    // Get first user
    const user1Result = await client.query(
      'SELECT id, email FROM users WHERE id IN (SELECT DISTINCT user_id FROM holdings WHERE status = $1)',
      ['owned']
    );

    if (user1Result.rows.length === 0) {
      console.log('No users with owned artworks found. Cannot proceed with swap test.');
      process.exit(1);
    }

    const user1 = user1Result.rows[0];
    console.log(`✓ Found User1: ${user1.email} (${user1.id})`);

    // Create a second test user with some balance and an artwork
    const user2Email = `testswap_${Date.now()}@test.com`;
    const user2Insert = await client.query(
      `INSERT INTO users (email, password, wallet_address, wallet_balance) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [user2Email, 'hashed_password', `0x${Math.random().toString(16).slice(2)}`, 5000]
    );
    const user2Id = user2Insert.rows[0].id;
    console.log(`✓ Created User2: ${user2Email} (${user2Id}) - Balance: 5000`);

    // Get an artwork for user1
    const user1ArtResult = await client.query(
      'SELECT art_id FROM holdings WHERE user_id = $1 AND status = $2 LIMIT 1',
      [user1.id, 'owned']
    );
    const art1 = user1ArtResult.rows[0].art_id;
    console.log(`✓ User1 artwork: ${art1}`);

    // Create a holding for user2 (assign them an artwork)
    // First, get an available artwork ID
    const availableArtResult = await client.query(
      `SELECT DISTINCT art_id FROM holdings 
       WHERE art_id NOT IN (SELECT art_id FROM holdings WHERE user_id = $1 AND status = $2)
       LIMIT 1`,
      [user1.id, 'owned']
    );
    
    if (availableArtResult.rows.length === 0) {
      console.log('Not enough artworks. Creating a new holding for user2...');
      // Use a different art_id
      const art2 = Math.random().toString(36).substring(7);
      await client.query(
        'INSERT INTO holdings (user_id, art_id, status) VALUES ($1, $2, $3)',
        [user2Id, art2, 'owned']
      );
      console.log(`✓ Created artwork for User2: ${art2}`);

      console.log(`\n=== Test Setup Complete ===`);
      console.log(`User1: ${user1.email}`);
      console.log(`User1 ID: ${user1.id}`);
      console.log(`User1 Art: ${art1}`);
      console.log(`\nUser2: ${user2Email}`);
      console.log(`User2 ID: ${user2Id}`);
      console.log(`User2 Art: ${art2}`);
    } else {
      const art2 = availableArtResult.rows[0].art_id;
      await client.query(
        'INSERT INTO holdings (user_id, art_id, status) VALUES ($1, $2, $3)',
        [user2Id, art2, 'owned']
      );
      console.log(`✓ User2 artwork: ${art2}`);

      console.log(`\n=== Test Setup Complete ===`);
      console.log(`User1: ${user1.email}`);
      console.log(`User1 ID: ${user1.id}`);
      console.log(`User1 Art: ${art1}`);
      console.log(`\nUser2: ${user2Email}`);
      console.log(`User2 ID: ${user2Id}`);
      console.log(`User2 Art: ${art2}`);
    }

    await client.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupTestData();
