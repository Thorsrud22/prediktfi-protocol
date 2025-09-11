# Database Configuration and Performance

## Prisma Connection Pooling

The application uses Prisma with connection pooling for optimal database performance:

### Environment Variables
```bash
# Database URL with connection pooling parameters
DATABASE_URL="postgresql://user:password@localhost:5432/prediktfi?connection_limit=10&pool_timeout=20&connect_timeout=60"

# Or for SQLite (development)
DATABASE_URL="file:./dev.db"
```

### Pool Configuration
- **Min Connections**: 2 (default)
- **Max Connections**: 10 (configurable via connection_limit)
- **Pool Timeout**: 20 seconds
- **Connect Timeout**: 60 seconds
- **Idle Timeout**: 10 seconds (undici default)

## Database Indexes

### Leaderboard Performance
```sql
-- Composite index for leaderboard queries (score DESC, accuracy DESC, insightsCount DESC)
CREATE INDEX idx_creators_leaderboard ON creators(score, accuracy, insightsCount);

-- Single column indexes for filtering
CREATE INDEX idx_creators_last_score_update ON creators(lastScoreUpdate);
```

**Why this index works:**
- The composite index `(score, accuracy, insightsCount)` allows efficient sorting for leaderboard queries
- PostgreSQL can use this index for `ORDER BY score DESC, accuracy DESC, insightsCount DESC`
- Covers the most common leaderboard sorting patterns

### Feed Performance
```sql
-- Composite index for feed queries (createdAt DESC, category, status)
CREATE INDEX idx_insights_feed ON insights(createdAt, category, status);

-- Single column indexes for filtering
CREATE INDEX idx_insights_created_at ON insights(createdAt);
CREATE INDEX idx_insights_category ON insights(category);
CREATE INDEX idx_insights_status ON insights(status);
CREATE INDEX idx_insights_stamped ON insights(stamped);
CREATE INDEX idx_insights_creator_id ON insights(creatorId);
```

**Why this index works:**
- The composite index `(createdAt, category, status)` supports common feed queries
- Allows efficient filtering by category and status while maintaining chronological order
- Covers queries like: `WHERE category = 'crypto' AND status = 'OPEN' ORDER BY createdAt DESC`

### Query Performance Examples

#### Leaderboard Query
```sql
-- This query will use the composite index efficiently
SELECT id, handle, score, accuracy, totalInsights, resolvedInsights, averageBrier
FROM creators 
ORDER BY score DESC, accuracy DESC, insightsCount DESC 
LIMIT 50;
```

#### Feed Query
```sql
-- This query will use the composite index efficiently
SELECT id, question, category, probability, confidence, createdAt
FROM insights 
WHERE category = 'crypto' AND status = 'OPEN'
ORDER BY createdAt DESC 
LIMIT 20 OFFSET 0;
```

## Performance Monitoring

### Query Analysis
Use `EXPLAIN ANALYZE` to verify index usage:

```sql
-- Check leaderboard query performance
EXPLAIN ANALYZE 
SELECT id, handle, score, accuracy 
FROM creators 
ORDER BY score DESC 
LIMIT 50;

-- Check feed query performance  
EXPLAIN ANALYZE
SELECT id, question, category, createdAt
FROM insights 
WHERE category = 'crypto' 
ORDER BY createdAt DESC 
LIMIT 20;
```

### Expected Performance
- **Leaderboard queries**: < 50ms for 50 results
- **Feed queries**: < 100ms for 20 results with filters
- **Index scans**: Should show "Index Scan" in EXPLAIN output
- **No sequential scans**: Avoid "Seq Scan" for large tables

## Migration Commands

### Add New Indexes
```bash
# Generate migration for new indexes
npx prisma migrate dev --name add_performance_indexes

# Apply migration to production
npx prisma migrate deploy
```

### Verify Indexes
```sql
-- List all indexes on creators table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'creators';

-- List all indexes on insights table  
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'insights';
```

## Connection Pool Monitoring

### Prisma Metrics
- Monitor connection pool usage in application logs
- Watch for connection timeout errors
- Track query execution times

### Database Metrics
- Active connections: Should stay within pool limits
- Idle connections: Should be minimal
- Query duration: P95 < 200ms for critical queries
