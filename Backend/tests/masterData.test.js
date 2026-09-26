const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Warehouse = require('../src/models/Warehouse');
const Location = require('../src/models/Location');
const Quant = require('../src/models/Quant');
const { signToken } = require('../src/middleware/auth');
const { toDecimal128 } = require('../src/utils/decimalHelper');
const stockCheckService = require('../src/services/stockCheck');

let mongod;
let managerUser;
let staffUser;
let managerToken;
let staffToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await User.init();
  await Product.init();
  await Warehouse.init();
  await Location.init();
  await Quant.init();
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Warehouse.deleteMany({});
  await Location.deleteMany({});
  await Quant.deleteMany({});

  // Seed Manager
  managerUser = await User.create({
    name: 'Inventory Manager',
    email: 'manager@stocksense.test',
    passwordHash: 'hash123',
    role: 'manager',
    mustChangePassword: false,
    active: true,
  });
  managerToken = signToken(managerUser);

  // Seed Staff
  staffUser = await User.create({
    name: 'Warehouse Staff',
    email: 'staff@stocksense.test',
    passwordHash: 'hash123',
    role: 'staff',
    mustChangePassword: false,
    active: true,
  });
  staffToken = signToken(staffUser);
});

describe('Segment A: Products Master Data & RBAC', () => {
  describe('GET /api/products and /api/products/:id', () => {
    let activeProd;
    let inactiveProd;

    beforeEach(async () => {
      activeProd = await Product.create({
        name: 'Active Product',
        sku: 'SKU-ACTIVE',
        category: 'Electronics',
        unitOfMeasure: 'pcs',
        reorderPoint: 10,
        active: true,
      });

      inactiveProd = await Product.create({
        name: 'Inactive Product',
        sku: 'SKU-INACTIVE',
        category: 'Electronics',
        unitOfMeasure: 'pcs',
        reorderPoint: 5,
        active: false,
      });
    });

    test('Staff and Manager can list products, default filters to active: true', async () => {
      const staffRes = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(staffRes.status).toBe(200);
      expect(staffRes.body.data.length).toBe(1);
      expect(staffRes.body.data[0].sku).toBe('SKU-ACTIVE');

      const managerRes = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(managerRes.status).toBe(200);
      expect(managerRes.body.data.length).toBe(1);
    });

    test('?includeInactive=true includes soft-deleted products', async () => {
      const res = await request(app)
        .get('/api/products?includeInactive=true')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      const skus = res.body.data.map(p => p.sku);
      expect(skus).toContain('SKU-ACTIVE');
      expect(skus).toContain('SKU-INACTIVE');
    });

    test('GET /api/products/:id returns 404 for inactive product by default', async () => {
      const resActive = await request(app)
        .get(`/api/products/${activeProd._id}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(resActive.status).toBe(200);
      expect(resActive.body.sku).toBe('SKU-ACTIVE');

      const resInactive = await request(app)
        .get(`/api/products/${inactiveProd._id}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(resInactive.status).toBe(404);
      expect(resInactive.body.error.code).toBe('PRODUCT_NOT_FOUND');

      const resInactiveWithParam = await request(app)
        .get(`/api/products/${inactiveProd._id}?includeInactive=true`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(resInactiveWithParam.status).toBe(200);
      expect(resInactiveWithParam.body.sku).toBe('SKU-INACTIVE');
    });
  });

  describe('POST /api/products (Create Product)', () => {
    test('Manager can create a product', async () => {
      const payload = {
        name: 'New Product',
        sku: 'SKU-NEW-100',
        category: 'Hardware',
        unitOfMeasure: 'boxes',
        reorderPoint: 25,
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.sku).toBe('SKU-NEW-100');
      expect(res.body.active).toBe(true);

      const inDb = await Product.findOne({ sku: 'SKU-NEW-100' });
      expect(inDb).toBeTruthy();
    });

    test('Staff is blocked with 403 FORBIDDEN', async () => {
      const payload = {
        name: 'Staff Created Product',
        sku: 'SKU-STAFF',
        unitOfMeasure: 'pcs',
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Duplicate SKU returns 400 DUPLICATE_SKU in global error shape', async () => {
      await Product.create({
        name: 'Original Product',
        sku: 'SKU-DUP',
        unitOfMeasure: 'pcs',
        active: true,
      });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Duplicate Product',
          sku: 'SKU-DUP',
          unitOfMeasure: 'pcs',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('DUPLICATE_SKU');
      expect(res.body.error.details.sku).toBe('SKU-DUP');
    });
  });

  describe('PUT and DELETE /api/products/:id', () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        name: 'Editable Product',
        sku: 'SKU-EDIT',
        category: 'Parts',
        unitOfMeasure: 'kg',
        reorderPoint: 5,
        active: true,
      });
    });

    test('Manager can edit product; Staff is blocked with 403', async () => {
      // Staff blocked
      const staffRes = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Edited' });

      expect(staffRes.status).toBe(403);
      expect(staffRes.body.error.code).toBe('FORBIDDEN');

      // Manager succeeds
      const managerRes = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Manager Edited' });

      expect(managerRes.status).toBe(200);
      expect(managerRes.body.name).toBe('Manager Edited');
    });

    test('Manager can soft-delete product (DELETE sets active: false); Staff blocked with 403', async () => {
      // Staff blocked
      const staffRes = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(staffRes.status).toBe(403);
      expect(staffRes.body.error.code).toBe('FORBIDDEN');

      // Manager succeeds
      const managerRes = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(managerRes.status).toBe(200);

      // Verify soft-delete in DB (not hard-deleted)
      const inDb = await Product.findById(product._id);
      expect(inDb).toBeTruthy();
      expect(inDb.active).toBe(false);
    });
  });

  describe('GET /api/products/:id/stock (Proxy)', () => {
    test('returns stock levels for product', async () => {
      const prod = await Product.create({
        name: 'Stocked Product',
        sku: 'SKU-STOCKED',
        unitOfMeasure: 'pcs',
        active: true,
      });

      const wh = await Warehouse.create({ name: 'Main WH', active: true });
      const loc = await Location.create({ warehouseId: wh._id, name: 'Rack 1', active: true });

      // Create quant in DB
      await Quant.create({
        productId: prod._id,
        warehouseId: wh._id,
        locationId: loc._id,
        quantity: toDecimal128('42'),
      });

      const res = await request(app)
        .get(`/api/products/${prod._id}/stock`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.productId).toBe(prod._id.toString());
      expect(res.body.stock.length).toBe(1);
      expect(res.body.stock[0].quantity).toBe('42');
    });
  });
});

describe('Segment A: Warehouses & Locations Master Data & RBAC', () => {
  describe('Warehouse CRUD & Stock Deletion Guards', () => {
    let warehouse;

    beforeEach(async () => {
      warehouse = await Warehouse.create({ name: 'Central Distribution', active: true });
    });

    test('Staff can view warehouses; blocked from POST /api/warehouses (403)', async () => {
      // View succeeds
      const getRes = await request(app)
        .get('/api/warehouses')
        .set('Authorization', `Bearer ${staffToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBe(1);

      // Create blocked
      const postRes = await request(app)
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Warehouse' });

      expect(postRes.status).toBe(403);
      expect(postRes.body.error.code).toBe('FORBIDDEN');
    });

    test('Manager can create and patch a warehouse', async () => {
      const createRes = await request(app)
        .post('/api/warehouses')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'North Warehouse' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.name).toBe('North Warehouse');

      const patchRes = await request(app)
        .patch(`/api/warehouses/${createRes.body._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'North Facility Updated' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.name).toBe('North Facility Updated');
    });

    test('DELETE /api/warehouses/:id is blocked with 409 WAREHOUSE_HAS_STOCK when stock exists', async () => {
      const prod = await Product.create({ name: 'Item', sku: 'SKU-ITEM', unitOfMeasure: 'pcs' });
      const loc = await Location.create({ warehouseId: warehouse._id, name: 'Bin A' });

      // Add positive quant
      await Quant.create({
        productId: prod._id,
        warehouseId: warehouse._id,
        locationId: loc._id,
        quantity: toDecimal128('15'),
      });

      const res = await request(app)
        .delete(`/api/warehouses/${warehouse._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('WAREHOUSE_HAS_STOCK');
      expect(res.body.error.details.warehouseId).toBe(warehouse._id.toString());

      // Warehouse remains active
      const inDb = await Warehouse.findById(warehouse._id);
      expect(inDb.active).toBe(true);
    });

    test('DELETE /api/warehouses/:id soft-deletes warehouse (active: false) when zero stock', async () => {
      const res = await request(app)
        .delete(`/api/warehouses/${warehouse._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);

      // Verify soft deletion
      const inDb = await Warehouse.findById(warehouse._id);
      expect(inDb).toBeTruthy();
      expect(inDb.active).toBe(false);
    });
  });

  describe('Location CRUD & Stock Deletion Guards', () => {
    let warehouse;
    let location;

    beforeEach(async () => {
      warehouse = await Warehouse.create({ name: 'West Hub', active: true });
      location = await Location.create({ warehouseId: warehouse._id, name: 'Rack 10', active: true });
    });

    test('Staff can view locations; blocked from POST / PATCH / DELETE locations (403)', async () => {
      // Staff view locations
      const getRes = await request(app)
        .get(`/api/warehouses/${warehouse._id}/locations`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBe(1);

      // Staff create location blocked
      const postRes = await request(app)
        .post(`/api/warehouses/${warehouse._id}/locations`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Rack' });
      expect(postRes.status).toBe(403);
      expect(postRes.body.error.code).toBe('FORBIDDEN');

      // Staff patch location blocked
      const patchRes = await request(app)
        .patch(`/api/warehouses/${warehouse._id}/locations/${location._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Rename' });
      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error.code).toBe('FORBIDDEN');

      // Staff delete location blocked
      const deleteRes = await request(app)
        .delete(`/api/warehouses/${warehouse._id}/locations/${location._id}`)
        .set('Authorization', `Bearer ${staffToken}`);
      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.error.code).toBe('FORBIDDEN');
    });

    test('Manager can create and patch location', async () => {
      const createRes = await request(app)
        .post(`/api/warehouses/${warehouse._id}/locations`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Rack 20' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.name).toBe('Rack 20');

      const patchRes = await request(app)
        .patch(`/api/warehouses/${warehouse._id}/locations/${createRes.body._id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Rack 20 - Fast Picking' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.name).toBe('Rack 20 - Fast Picking');
    });

    test('DELETE location blocked with 409 LOCATION_HAS_STOCK when location contains stock', async () => {
      const prod = await Product.create({ name: 'Bolts', sku: 'SKU-BOLTS', unitOfMeasure: 'pcs' });

      // Add quant in this location
      await Quant.create({
        productId: prod._id,
        warehouseId: warehouse._id,
        locationId: location._id,
        quantity: toDecimal128('100'),
      });

      const res = await request(app)
        .delete(`/api/warehouses/${warehouse._id}/locations/${location._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('LOCATION_HAS_STOCK');
      expect(res.body.error.details.locationId).toBe(location._id.toString());

      // Location remains active
      const inDb = await Location.findById(location._id);
      expect(inDb.active).toBe(true);
    });

    test('DELETE location soft-deletes (active: false) when zero stock', async () => {
      const res = await request(app)
        .delete(`/api/warehouses/${warehouse._id}/locations/${location._id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);

      // Verify soft deletion
      const inDb = await Location.findById(location._id);
      expect(inDb).toBeTruthy();
      expect(inDb.active).toBe(false);
    });
  });
});
