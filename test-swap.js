const http = require('http');

function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  try {
    console.log('=== SWAP FLOW TEST ===\n');

    // Get users
    console.log('1. Fetching users...');
    const users = await request('/api/users');
    console.log(`Found ${users.length} users`);
    const user1 = users[0];
    const user2 = users[1];
    console.log(`User1: ${user1.email} (${user1.id}) - Balance: ${user1.wallet_balance}`);
    console.log(`User2: ${user2.email} (${user2.id}) - Balance: ${user2.wallet_balance}\n`);

    // Get holdings to find artworks
    console.log('2. Fetching holdings for artwork selection...');
    const user1Holdings = await request(`/api/holdings/${user1.id}`);
    const user2Holdings = await request(`/api/holdings/${user2.id}`);
    
    const user1Art = user1Holdings.find(h => h.status === 'owned');
    const user2Art = user2Holdings.find(h => h.status === 'owned');
    
    if (!user1Art || !user2Art) {
      console.log('ERROR: Users do not have owned artworks');
      console.log(`User1 holdings:`, user1Holdings);
      console.log(`User2 holdings:`, user2Holdings);
      process.exit(1);
    }
    
    console.log(`User1 owns artwork: ${user1Art.art_id}`);
    console.log(`User2 owns artwork: ${user2Art.art_id}\n`);

    // Create swap proposal
    console.log('3. Creating swap proposal (User1 -> User2)...');
    const swapPayload = {
      user1_id: user1.id,
      user2_id: user2.id,
      user1_art_id: user1Art.art_id,
      user2_art_id: user2Art.art_id,
      cash_amount: 0  // No cash, just artwork exchange
    };
    console.log('Payload:', JSON.stringify(swapPayload, null, 2));
    
    const swapResult = await request('/api/swap', 'POST', swapPayload);
    if (!swapResult.transaction) {
      console.log('ERROR creating swap:', swapResult);
      process.exit(1);
    }
    
    const transactionId = swapResult.transaction.id;
    console.log(`✓ Swap created: ${transactionId}`);
    console.log(`  Status: ${swapResult.transaction.status}`);
    console.log(`  Escrows created: ${swapResult.escrows.length}\n`);

    // Check escrow state
    console.log('4. Verifying escrow creation...');
    const escrows = swapResult.escrows;
    escrows.forEach((e, i) => {
      console.log(`  Escrow ${i+1}: ${e.id} - Amount: ${e.amount} - Status: ${e.status}`);
    });

    // Check holdings are locked
    console.log('\n5. Checking holdings status after swap creation...');
    const user1HoldingsAfter = await request(`/api/holdings/${user1.id}`);
    const user2HoldingsAfter = await request(`/api/holdings/${user2.id}`);
    console.log(`User1 art status: ${user1HoldingsAfter.find(h => h.art_id === user1Art.art_id)?.status}`);
    console.log(`User2 art status: ${user2HoldingsAfter.find(h => h.art_id === user2Art.art_id)?.status}\n`);

    // Accept swap
    console.log(`6. Accepting swap (${transactionId})...`);
    const acceptResult = await request(`/api/swap/${transactionId}/accept`, 'PATCH');
    if (acceptResult.error) {
      console.log('ERROR accepting swap:', acceptResult);
      process.exit(1);
    }
    console.log('✓ Swap accepted');
    console.log(`  Transaction status: ${acceptResult.transaction.status}`);
    console.log(`  Escrows released: ${acceptResult.escrows.length}\n`);

    // Final verification
    console.log('7. Final verification - checking holdings transfer...');
    const user1FinalHoldings = await request(`/api/holdings/${user1.id}`);
    const user2FinalHoldings = await request(`/api/holdings/${user2.id}`);
    
    const user1HasUser2Art = user1FinalHoldings.some(h => h.art_id === user2Art.art_id && h.status === 'owned');
    const user2HasUser1Art = user2FinalHoldings.some(h => h.art_id === user1Art.art_id && h.status === 'owned');
    
    console.log(`User1 now owns User2's artwork (${user2Art.art_id}): ${user1HasUser2Art}`);
    console.log(`User2 now owns User1's artwork (${user1Art.art_id}): ${user2HasUser1Art}\n`);

    if (user1HasUser2Art && user2HasUser1Art) {
      console.log('✓ SWAP SUCCESSFUL - Both artworks transferred correctly!');
    } else {
      console.log('✗ SWAP FAILED - Artworks were not transferred');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
  
  process.exit(0);
}

test();
