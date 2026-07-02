export {}

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing-only'
process.env.NODE_ENV = 'test'
