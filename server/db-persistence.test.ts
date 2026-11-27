import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { FLEET_CARS } from '../src/data/fleet.ts';
import { CarModel } from './models.ts';
import { db, initDatabase } from './db.ts';

test('database startup fails clearly without MongoDB and never selects local storage', async () => {
  const previousUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    await assert.rejects(
      initDatabase(),
      /MONGODB_URI is required\. JSON\/local filesystem storage is disabled\./,
    );
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  }
});

test(
  'MongoDB records remain available after disconnect and reconnect',
  { skip: !process.env.MONGODB_TEST_URI },
  async () => {
    const uri = process.env.MONGODB_TEST_URI!;
    const databaseName = decodeURIComponent(
      uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^/?]+)/i)?.[1] ?? 'test',
    );
    assert.match(databaseName, /test/i, 'MONGODB_TEST_URI must target a database with "test" in its name');

    const previousUri = process.env.MONGODB_URI;
    const id = `persistence-test-${randomUUID()}`;
    process.env.MONGODB_URI = uri;
    try {
      await initDatabase();
      const car = {
        ...FLEET_CARS[0],
        id,
        slug: id,
        name: 'Persistence test car',
        dailyRateInr: 9876,
        imageUrl: '/api/images/persistence-test',
      };
      await db.createCar(car);

      await mongoose.disconnect();
      await initDatabase();
      const restored = await db.getCarById(id);
      assert.equal(restored?.name, car.name);
      assert.equal(restored?.dailyRateInr, car.dailyRateInr);
      assert.equal(restored?.imageUrl, car.imageUrl);
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await CarModel.deleteOne({ id });
        await mongoose.disconnect();
      }
      if (previousUri === undefined) delete process.env.MONGODB_URI;
      else process.env.MONGODB_URI = previousUri;
    }
  },
);
