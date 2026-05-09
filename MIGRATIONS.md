# Database Migrations Guide

This project uses TypeORM migrations for managing database schema changes in production.

## Available Migration Commands

```bash
# Generate a new migration based on entity changes
npm run migration:generate --name=MigrationName

# Run pending migrations
npm run migration:run

# Revert the last executed migration
npm run migration:revert

# Show all migrations and their status
npm run migration:show
```

## Initial Production Setup

### 1. Prepare Production Environment

Create a `.env.production` file with your production database credentials:

```bash
cp .env.production.example .env.production
# Edit .env.production with your actual production values
```

Make sure to set:
- `NODE_ENV=production`
- `DB_SYNCHRONIZE=false` (migrations will handle schema)
- Your production database credentials
- Secure JWT_SECRET
- Production API keys

### 2. Run Initial Migration

For a fresh production database, run:

```bash
# Set production environment
export NODE_ENV=production

# Run the initial migration
npm run migration:run
```

This will execute the `InitProd` migration which creates all tables:
- User
- Destination
- Package (and related tables: Gallery, Inclusions, Exclusions, Pricing, Accommodations)
- PackageItineraryDay (and related tables: Activities, Day Accommodations)
- BlogPost
- Booking (and BookingGuest)
- ContactEnquiry

### 3. Verify Migration

Check that the migration was successful:

```bash
npm run migration:show
```

You should see the `InitProd` migration marked as executed.

## Development vs Production

### Development
- Uses `synchronize: true` by default
- Schema changes are automatically applied
- Good for rapid development
- **Never use in production!**

### Production
- Uses `synchronize: false`
- Schema changes via migrations only
- Controlled, versioned database changes
- Rollback capability with `migration:revert`

## Creating New Migrations

When you modify entities in development:

1. Make your entity changes
2. Generate a migration:
   ```bash
   npm run migration:generate --name=AddUserRole
   ```
3. Review the generated migration in `src/database/migrations/`
4. Test locally with `npm run migration:run`
5. Commit the migration file
6. Deploy and run migrations in production

## Migration Best Practices

1. **Always review generated migrations** before running them
2. **Test migrations locally** before deploying to production
3. **Backup your database** before running migrations in production
4. **Never edit executed migrations** - create a new one instead
5. **Keep migrations small and focused** on one change
6. **Name migrations descriptively** (e.g., `AddUserRoleColumn`, `CreateProductsTable`)

## Rollback Strategy

If a migration causes issues:

```bash
# Revert the last migration
npm run migration:revert
```

Note: Only revert if you haven't deployed dependent code yet!

## Production Deployment Checklist

- [ ] Review all pending migrations
- [ ] Backup production database
- [ ] Set `NODE_ENV=production`
- [ ] Set `DB_SYNCHRONIZE=false`
- [ ] Run `npm run migration:show` to check status
- [ ] Run `npm run migration:run`
- [ ] Verify application starts successfully
- [ ] Test critical functionality
- [ ] Monitor logs for database errors

## Troubleshooting

### "No changes in database schema were found"

This means your database schema matches your entities. This is expected when:
- Your database is already up to date
- You're using `synchronize: true` in development

To force create a migration, use TypeORM's create command instead:
```bash
npx typeorm migration:create src/database/migrations/MigrationName
```

### "ER_TABLE_EXISTS_ERROR"

The table already exists. This usually means:
- Migration already ran
- `synchronize: true` already created the tables

Check migration status with `npm run migration:show`

### Connection Issues

Verify your database credentials in `.env` or `.env.production`:
- DB_HOST
- DB_PORT
- DB_USERNAME
- DB_PASSWORD
- DB_NAME

## Additional Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [TypeORM CLI Documentation](https://typeorm.io/using-cli)
