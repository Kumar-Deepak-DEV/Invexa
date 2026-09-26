const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../src/models/User');
const Warehouse = require('../src/models/Warehouse');
const { requireRole, requireWarehouseAccess } = require('../src/middleware/warehouseScope');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await User.init();
  await Warehouse.init();
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Warehouse.deleteMany({});
});

describe('Segment A: warehouseScope Middleware Suite', () => {
  describe('requireRole middleware', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Dummy route protected by requireRole('manager')
      app.get(
        '/manager-only',
        (req, res, next) => {
          // Simulate user attached to req
          const role = req.headers['x-role'];
          if (role) {
            req.user = { userId: new mongoose.Types.ObjectId().toString(), role };
          }
          next();
        },
        requireRole('manager'),
        (req, res) => res.json({ ok: true })
      );
    });

    test('allows user with matching role', async () => {
      const res = await request(app).get('/manager-only').set('x-role', 'manager');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('rejects user with different role with 403 FORBIDDEN', async () => {
      const res = await request(app).get('/manager-only').set('x-role', 'staff');
      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('rejects unauthenticated request with 401 UNAUTHORIZED', async () => {
      const res = await request(app).get('/manager-only');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('requireWarehouseAccess middleware', () => {
    let app;
    let whA;
    let whB;
    let whInactive;
    let staffUser;
    let managerUser;

    beforeEach(async () => {
      // Create warehouses
      whA = await Warehouse.create({ name: 'Warehouse A', active: true });
      whB = await Warehouse.create({ name: 'Warehouse B', active: true });
      whInactive = await Warehouse.create({ name: 'Warehouse Inactive', active: false });

      // Create users
      staffUser = await User.create({
        name: 'Staff Warehouse A',
        email: 'staff.a@stocksense.test',
        passwordHash: 'hash',
        role: 'staff',
        assignedWarehouses: [whA._id],
        active: true,
      });

      managerUser = await User.create({
        name: 'Manager Global',
        email: 'manager@stocksense.test',
        passwordHash: 'hash',
        role: 'manager',
        assignedWarehouses: [],
        active: true,
      });

      app = express();
      app.use(express.json());

      // Helper to simulate auth user on req
      app.use((req, res, next) => {
        const userId = req.headers['x-user-id'];
        const role = req.headers['x-user-role'];
        if (userId) {
          req.user = { userId, role };
        }
        next();
      });

      // Single warehouse route: reads from req.body.warehouseId
      app.post(
        '/single-warehouse',
        requireWarehouseAccess(req => [req.body.warehouseId]),
        (req, res) => res.json({ ok: true })
      );

      // Transfer route: returns { source, dest }
      app.post(
        '/transfer',
        requireWarehouseAccess(req => ({
          source: req.body.sourceWarehouseId,
          dest: req.body.destWarehouseId,
        })),
        (req, res) => res.json({ ok: true })
      );
    });

    test('1. Manager bypass: Manager can access any warehouse without scoping', async () => {
      // Manager accessing warehouse they are not explicitly assigned to
      const res = await request(app)
        .post('/single-warehouse')
        .set('x-user-id', managerUser._id.toString())
        .set('x-user-role', 'manager')
        .send({ warehouseId: whA._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Manager executing transfer between any warehouses
      const transferRes = await request(app)
        .post('/transfer')
        .set('x-user-id', managerUser._id.toString())
        .set('x-user-role', 'manager')
        .send({
          sourceWarehouseId: whA._id.toString(),
          destWarehouseId: whB._id.toString(),
        });

      expect(transferRes.status).toBe(200);
      expect(transferRes.body.ok).toBe(true);
    });

    test('2. Staff with correct single warehouse succeeds', async () => {
      const res = await request(app)
        .post('/single-warehouse')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({ warehouseId: whA._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('3. Staff with wrong single warehouse is rejected with 403 WAREHOUSE_NOT_ASSIGNED', async () => {
      const res = await request(app)
        .post('/single-warehouse')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({ warehouseId: whB._id.toString() });

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('WAREHOUSE_NOT_ASSIGNED');
    });

    test('4. Staff with valid transfer (assigned to BOTH source and destination) succeeds', async () => {
      // Assign staff to both whA and whB
      staffUser.assignedWarehouses = [whA._id, whB._id];
      await staffUser.save();

      const res = await request(app)
        .post('/transfer')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({
          sourceWarehouseId: whA._id.toString(),
          destWarehouseId: whB._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('5a. Segment A §10 Acceptance Test: Staff assigned only to Warehouse A is rejected on transfer FROM A TO B', async () => {
      // staffUser is assigned ONLY to whA
      const res = await request(app)
        .post('/transfer')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({
          sourceWarehouseId: whA._id.toString(),
          destWarehouseId: whB._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('WAREHOUSE_NOT_ASSIGNED');
      expect(res.body.error.details.warehouseId).toBe(whB._id.toString());
    });

    test('5b. Staff assigned only to Warehouse B is rejected on transfer FROM A TO B', async () => {
      // Create user assigned only to whB
      const staffB = await User.create({
        name: 'Staff Warehouse B',
        email: 'staff.b@stocksense.test',
        passwordHash: 'hash',
        role: 'staff',
        assignedWarehouses: [whB._id],
        active: true,
      });

      const res = await request(app)
        .post('/transfer')
        .set('x-user-id', staffB._id.toString())
        .set('x-user-role', 'staff')
        .send({
          sourceWarehouseId: whA._id.toString(),
          destWarehouseId: whB._id.toString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('WAREHOUSE_NOT_ASSIGNED');
      expect(res.body.error.details.warehouseId).toBe(whA._id.toString());
    });

    test('6. Staff acting on an inactive (soft-deleted) warehouse is rejected with 409 WAREHOUSE_INACTIVE', async () => {
      // Assign staff to inactive warehouse
      staffUser.assignedWarehouses = [whInactive._id];
      await staffUser.save();

      const res = await request(app)
        .post('/single-warehouse')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({ warehouseId: whInactive._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('WAREHOUSE_INACTIVE');
      expect(res.body.error.details.warehouseId).toBe(whInactive._id.toString());
    });

    test('7. Transfer involving an inactive warehouse is rejected with 409 WAREHOUSE_INACTIVE', async () => {
      // Assign staff to both whA and whInactive
      staffUser.assignedWarehouses = [whA._id, whInactive._id];
      await staffUser.save();

      const res = await request(app)
        .post('/transfer')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({
          sourceWarehouseId: whA._id.toString(),
          destWarehouseId: whInactive._id.toString(),
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('WAREHOUSE_INACTIVE');
      expect(res.body.error.details.warehouseId).toBe(whInactive._id.toString());
    });

    test('8. Live DB read: assignment updates take effect immediately on next request', async () => {
      // Initially, staff is only assigned to whA, accessing whB fails
      const res1 = await request(app)
        .post('/single-warehouse')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({ warehouseId: whB._id.toString() });
      expect(res1.status).toBe(403);

      // Manager updates staff assignment in DB (adds whB)
      staffUser.assignedWarehouses = [whA._id, whB._id];
      await staffUser.save();

      // Next request immediately succeeds without requiring re-login
      const res2 = await request(app)
        .post('/single-warehouse')
        .set('x-user-id', staffUser._id.toString())
        .set('x-user-role', 'staff')
        .send({ warehouseId: whB._id.toString() });
      expect(res2.status).toBe(200);
      expect(res2.body.ok).toBe(true);
    });
  });
});
