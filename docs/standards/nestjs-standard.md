# NestJS Standard

## Overview

Twenty uses **NestJS 11** as the backend framework. The application is organized in four engine layers (API → Core Modules → Metadata Modules → TwentyORM) plus business logic modules. Dependency injection, decorators, guards, and middleware are used throughout.

## Core Principles

- **Module-based architecture.** Every capability is a NestJS module with clear imports/exports.
- **Dependency injection.** Services are injected via constructor parameters. No manual instantiation.
- **Decorator-driven metadata.** Entity classes, instance commands, guards, and permissions use decorators for registration and discovery.
- **Engine layer separation.** Core modules (infrastructure), metadata modules (schema), and business modules (CRM features) are distinct.
- **GraphQL-first API.** REST and MCP are complementary. The primary API protocol is GraphQL.
- **No `any` type.** All DTOs, services, and resolvers must have explicit TypeScript types.

## Configuration

NestJS modules follow the `@Module()` decorator pattern:

```typescript
@Module({
  imports: [
    CoreEngineModule,           // Infrastructure (auth, billing, storage, etc.)
    ModulesModule,               // Business logic modules
    CoreGraphQLApiModule,        // GraphQL endpoints
    MetadataGraphQLApiModule,
    AdminPanelGraphQLApiModule,
    RestApiModule,               // REST endpoints
    McpModule,                   // MCP server
  ],
})
export class AppModule {}
```

## Engine Layer Structure

```
API Layer (engine/api/)
  └── POST /graphql, /metadata, /admin-panel  (GraphQL Yoga)
      REST /rest/*, MCP /mcp
          │
Core Modules (engine/core-modules/)  — 76 modules
  └── auth, billing, workspace, user, storage, email, search, AI, etc.
          │
Metadata Modules (engine/metadata-modules/)  — 72 modules
  └── object-metadata, field-metadata, views, roles, permissions, etc.
          │
TwentyORM (engine/twenty-orm/)
  └── WorkspaceEntityManager, WorkspaceSchemaManager, EntitySchemaFactory
```

## Usage Patterns

### Module Definition

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity])],
  providers: [WorkspaceService, WorkspaceResolver],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
```

### Service with Dependency Injection

```typescript
@Injectable()
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceManagerService: WorkspaceManagerService,
  ) {}

  async findById(id: string): Promise<WorkspaceEntity | null> {
    return this.workspaceRepository.findOne({ where: { id } });
  }
}
```

### GraphQL Resolver

```typescript
@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Query(() => Workspace)
  async currentWorkspace(
    @AuthWorkspace() workspace: Workspace,
  ): Promise<Workspace> {
    return workspace;
  }
}
```

### Instance Command

```typescript
@RegisteredInstanceCommand('2.15.0', 1781600000000)
export class AddColumnFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ADD COLUMN IF NOT EXISTS "newField" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" DROP COLUMN IF EXISTS "newField"`,
    );
  }
}
```

### Guard Usage on Resolvers

```typescript
@Resolver()
export class SettingsResolver {
  @Mutation()
  @UseGuards(SettingsPermissionGuard('WORKSPACE'))
  async updateWorkspaceSettings(...) { ... }
}
```

### Middleware

```typescript
@Injectable()
export class GraphQLHydrateRequestFromTokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract JWT, validate, bind auth data to request
    next();
  }
}
```

## Do's

- Do use `@Injectable()` for all services.
- Do use constructor injection for dependencies.
- Do use `@Module()` with explicit `imports`, `providers`, and `exports`.
- Do implement both `up` and `down` in instance commands.
- Do use `IF EXISTS` / `IF NOT EXISTS` in migration SQL for idempotency.
- Do use `@RegisteredInstanceCommand` and `@RegisteredWorkspaceCommand` decorators for migration discovery.
- Do keep services under 500 lines. Extract helper services when needed.
- Do use GraphQL resolvers with explicit return types.

## Don'ts

- Don't manually instantiate services. Use DI.
- Don't put business logic in resolvers. Resolvers delegate to services.
- Don't modify committed instance command `up`/`down` logic. Write new commands.
- Don't hardcode workspace IDs or user IDs in queries. Use the request context.
- Don't use raw SQL outside of instance commands and schema managers.
- Don't skip `up` or `down` in instance commands. Both must be implemented.
- Don't use circular dependencies between modules. Use forward references only as a last resort.

## References

- `.cursor/rules/architecture.mdc` — IDE-specific NestJS rules.
- `docs/architecture/current-state.md` — Engine architecture overview.
- `docs/architecture/data-model.md` — Entity model and migrations.
- `docs/architecture/security-and-identity.md` — Auth, guards, and middleware.
- `packages/twenty-server/src/engine/` — Engine source code.
