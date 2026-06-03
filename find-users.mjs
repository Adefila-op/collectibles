import pg from 'pg';
const { Client } = pg;

async function findTestUsers() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'collectibles_db',
    password: 'Adefila111',
    port: 5432,
  });

  try {
    await client.connect();

    // Find users with owned artworks
    const result = await client.query(`
      SELECT DISTINCT u.id, u.email, u.wallet_balance, COUNT(h.id) as holding_count
      FROM users u
      LEFT JOIN holdings h ON u.id = h.user_id AND h.status = 'owned'
      GROUP BY u.id, u.email, u.wallet_balance
      HAVING COUNT(h.id) > 0
      ORDER BY u.wallet_balance DESC
      LIMIT 10
    `);

    console.log('=== Users with Owned Artworks ===\n');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.email.substring(0, 30).padEnd(30)} - Balance: ${row.wallet_balance.toString().padEnd(8)} - Holdings: ${row.holding_count}`);
    });

    if (result.rows.length >= 2) {
      const user1 = result.rows[0];
      const user2 = result.rows[1];
      
      console.log(`\n=== Using for Test ===`);
      console.log(`User1: ${user1.email} (${user1.id})`);
      console.log(`User2: ${user2.email} (${user2.id})`);
      
      // Get their artworks
      const holdings1 = await client.query('SELECT art_id, status FROM holdings WHERE user_id = $1 AND status = $2 LIMIT 1', [user1.id, 'owned']);
      const holdings2 = await client.query('SELECT art_id, status FROM holdings WHERE user_id = $1 AND status = $2 LIMIT 1', [user2.id, 'owned']);
      
      console.log(`\nUser1 artwork: ${holdings1.rows[0]?.art_id}`);
      console.log(`User2 artwork: ${holdings2.rows[0]?.art_id}`);
    }

    await client.end();
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

findTestUsers();
