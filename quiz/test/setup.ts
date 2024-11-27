import { AppDataSource } from '../src/config/database';
import path from 'path';

beforeAll(async () => {
  // Use a test database
  AppDataSource.setOptions({
    database: ':memory:',
    dropSchema: true,
    synchronize: true
  });
  await AppDataSource.initialize();
});

afterAll(async () => {
  await AppDataSource.destroy();
});

beforeEach(async () => {
  // Clear all tables before each test
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.clear();
  }
});