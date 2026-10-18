# Delivery phases

1. Foundation: schema, authentication, migration and design tokens. Migration/table count, password hash/verify and all twelve graph definitions checked.
2. Interface: landing, device/problem selection, authentication and wizard. TypeScript and Vite production build passed after syntax corrections.
3. API: real branching, owner-scoped persistence, pause/resume and answer correction. Integration tests verified state and private boundaries.
4. Workspace: graph-derived map, SVGs, timeline, notes, saved cases and case management. API behavior verified; manual visual review unavailable.
5. Costs/community: decimal comparison, explicit public submissions, search/filters, votes, reports and moderator controls. Integration tests passed.
6. Delivery: API regression suite, production build, static route checks, browser-test discovery, documentation and validated ZIP. Browser execution, PostgreSQL and deployment remain unverified.

There is no hardcoded frontend-only permanent storage layer. Seed examples are clearly fictional, and accounts/private cases use the actual API and database.
