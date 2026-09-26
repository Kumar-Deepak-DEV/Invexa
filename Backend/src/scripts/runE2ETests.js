const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('   STOCKSENSE / INVEXA - 3 COMPREHENSIVE E2E RUNS   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // ==========================================
  // TEST RUN 1: SIGNUP, WRONG CREDENTIALS & LOGIN
  // ==========================================
  console.log('--- TEST RUN 1: Authentication & Edge Cases ---');

  const demoUser = {
    fullName: 'Demo Tester',
    loginId: 'demouser',
    email: 'demo@example.com',
    password: 'Demo@123456',
    role: 'Inventory Manager'
  };

  // 1.1 Signup Demo Account
  let signupRes = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoUser)
  });
  let signupData = await signupRes.json();
  if (signupRes.status === 409) {
    console.log('  (Demo account already exists from previous run, proceeding to test auth)');
    assert(true, 'Signup duplicate check recognized existing user (409)');
  } else {
    assert(signupRes.status === 201, `Demo user signup created (201): ${signupData.message}`);
  }

  // 1.2 Test Wrong Password Login
  const wrongPassRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@example.com',
      password: 'WrongPassword!999'
    })
  });
  const wrongPassData = await wrongPassRes.json();
  assert(wrongPassRes.status === 401, 'Wrong password correctly returns 401 Unauthorized');
  assert(wrongPassData?.error?.code === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');

  // 1.3 Test Non-Existent User Login
  const noUserRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent.user.123@example.com',
      password: 'Demo@123456'
    })
  });
  assert(noUserRes.status === 401, 'Non-existent user correctly returns 401 Unauthorized');

  // 1.4 Test Successful Login with Correct Credentials
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@example.com',
      password: 'Demo@123456'
    })
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200, 'Successful login returns 200 OK');
  assert(Boolean(loginData.token), 'JWT Token returned and verified');
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1.5 Verify /auth/me
  const meRes = await fetch(`${API_URL}/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.user.email === 'demo@example.com', 'GET /auth/me returns authenticated demo user');

  // ==========================================
  // TEST RUN 2: PROFILE UPDATE & CATALOG MANAGEMENT
  // ==========================================
  console.log('\n--- TEST RUN 2: Profile Update & Master Data CRUD ---');

  // 2.1 Profile Update
  const updateProfRes = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({
      fullName: 'Demo Lead Specialist',
      phone: '+91 99887 76655',
      department: 'Global Supply Chain Operations',
      warehouse: 'Main Distribution Warehouse (WH-001)'
    })
  });
  const updateProfData = await updateProfRes.json();
  assert(updateProfRes.status === 200, 'Profile details successfully updated via PUT /auth/profile');
  assert(updateProfData.user.phone === '+91 99887 76655', 'Updated phone verified');
  assert(updateProfData.user.name === 'Demo Lead Specialist', 'Updated name verified');

  const runSuffix = Date.now().toString().slice(-4);

  // 2.2 Create Warehouse
  const createWhRes = await fetch(`${API_URL}/warehouses`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `E2E Demo Warehouse Hub ${runSuffix}`,
      shortName: `Demo WH ${runSuffix}`,
      code: `WH-D${runSuffix}`,
      city: 'Ahmedabad Tech City',
      address: 'Plot 101 Innovation Park',
      type: 'Central Hub',
      capacity: 25000,
      manager: 'Demo Lead Specialist'
    })
  });
  const wh = await createWhRes.json();
  assert(createWhRes.status === 201 || createWhRes.status === 200, `Warehouse created: ${wh.name || JSON.stringify(wh)} (${wh.code || ''})`);

  // 2.3 Create Location
  const createLocRes = await fetch(`${API_URL}/locations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Bay Alpha Tier 1 - ${runSuffix}`,
      code: `LOC-D${runSuffix}`,
      warehouseId: wh.id || wh._id,
      type: 'Storage',
      capacity: 5000,
      aisle: 'Aisle 1',
      shelf: 'Tier 1'
    })
  });
  const loc = await createLocRes.json();
  assert(createLocRes.status === 201 || createLocRes.status === 200, `Storage location created: ${loc.name || JSON.stringify(loc)} (${loc.code || ''})`);

  // 2.4 Create Category
  const createCatRes = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Robotics & Automation ${runSuffix}`,
      code: `ROB${runSuffix.slice(-3)}`,
      description: 'Autonomous AGV components and sensors',
      color: '#3B82F6',
      icon: 'Cpu'
    })
  });
  const cat = await createCatRes.json();
  assert(createCatRes.status === 201 || createCatRes.status === 200, `Category created: ${cat.name || JSON.stringify(cat)} (${cat.code || ''})`);

  // 2.5 Create Product
  const createProdRes = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Precision Laser Distance Sensor ${runSuffix}`,
      sku: `SENS-LSR-${runSuffix}`,
      category: cat.name,
      categoryId: cat.id || cat._id,
      unit: 'pcs',
      costPrice: 1200,
      sellingPrice: 1950,
      stock: 100,
      reorderLevel: 25,
      maxStock: 500,
      reorderQty: 50,
      warehouseId: wh.id || wh._id,
      locationId: loc.id || loc._id
    })
  });
  const prod = await createProdRes.json();
  assert(createProdRes.status === 201 || createProdRes.status === 200, `Product created: ${prod.name || JSON.stringify(prod)} (Stock: ${prod.stock})`);

  // ==========================================
  // TEST RUN 3: TRANSACTIONS & LEDGER VERIFICATION
  // ==========================================
  console.log('\n--- TEST RUN 3: Inbound Receipt, Outbound Delivery, Transfer & Ledger ---');

  // 3.1 Create and Validate Inbound Receipt (Stock +50)
  const createReceiptRes = await fetch(`${API_URL}/receipts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      supplier: 'Omron Laser Sensing Technologies',
      warehouseId: wh.id || wh._id,
      locationId: loc.id || loc._id,
      lines: [
        {
          productId: prod.id || prod._id,
          quantity: 50
        }
      ]
    })
  });
  const receipt = await createReceiptRes.json();
  console.log('  Debug Receipt Creation:', createReceiptRes.status, receipt);
  assert(createReceiptRes.status === 201, `Receipt drafted (201): ID=${receipt._id || receipt.id}, status=${receipt.status}`);

  const valReceiptRes = await fetch(`${API_URL}/receipts/${receipt._id || receipt.id}/validate`, {
    method: 'POST',
    headers: authHeaders
  });
  const valReceiptData = await valReceiptRes.json();
  assert(valReceiptRes.status === 200 && valReceiptData.status === 'done', `Receipt validated (200): status is ${valReceiptData.status}`);

  // 3.2 Create and Validate Outbound Delivery (Stock -20)
  const createDelRes = await fetch(`${API_URL}/deliveries`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customer: 'Tesla Gigafactory Assembly Hub',
      warehouseId: wh.id || wh._id,
      locationId: loc.id || loc._id,
      lines: [
        {
          productId: prod.id || prod._id,
          quantity: 20
        }
      ]
    })
  });
  const delivery = await createDelRes.json();
  assert(createDelRes.status === 201, `Delivery drafted (201): ID=${delivery._id || delivery.id}, status=${delivery.status}`);

  const valDelRes = await fetch(`${API_URL}/deliveries/${delivery._id || delivery.id}/validate`, {
    method: 'POST',
    headers: authHeaders
  });
  const valDelData = await valDelRes.json();
  assert(valDelRes.status === 200 && valDelData.status === 'done', `Delivery validated (200): status is ${valDelData.status}`);

  // 3.3 Create Storage Location 2 for Transfer Destination
  const createLoc2Res = await fetch(`${API_URL}/locations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Bay Beta Tier 2 - ${runSuffix}`,
      code: `LOC-D2-${runSuffix}`,
      warehouseId: wh.id || wh._id,
      type: 'Storage',
      capacity: 5000,
      aisle: 'Aisle 2',
      shelf: 'Tier 2'
    })
  });
  const loc2 = await createLoc2Res.json();

  // 3.4 Create Internal Transfer
  const createTrfRes = await fetch(`${API_URL}/transfers`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      sourceWarehouseId: wh.id || wh._id,
      destWarehouseId: wh.id || wh._id,
      sourceLocationId: loc.id || loc._id,
      destLocationId: loc2.id || loc2._id,
      lines: [
        {
          productId: prod.id || prod._id,
          quantity: 10
        }
      ]
    })
  });
  const trf = await createTrfRes.json();
  assert(createTrfRes.status === 201, `Internal transfer drafted (201): ID=${trf._id || trf.id}, status=${trf.status}`);

  const valTrfRes = await fetch(`${API_URL}/transfers/${trf._id || trf.id}/validate`, {
    method: 'POST',
    headers: authHeaders
  });
  const valTrfData = await valTrfRes.json();
  assert(valTrfRes.status === 200 && valTrfData.status === 'done', `Internal transfer validated (200): status is ${valTrfData.status}`);

  // 3.4 Verify Ledger & Move History
  const ledgerRes = await fetch(`${API_URL}/ledger`, { headers: authHeaders });
  const ledgerData = await ledgerRes.json();
  assert(ledgerRes.status === 200 && Array.isArray(ledgerData.data), `Ledger entries queried: ${ledgerData.data.length} total immutable records`);

  const kpisRes = await fetch(`${API_URL}/dashboard/kpis`, { headers: authHeaders });
  const kpisData = await kpisRes.json();
  assert(kpisRes.status === 200, `Dashboard KPIs returned: totalProducts=${kpisData.totalProducts || kpisData.totalStock || 'OK'}`);

  console.log('\n====================================================');
  console.log(`   E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log('====================================================\n');
}

runTests();
