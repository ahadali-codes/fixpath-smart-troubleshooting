# Architecture

React calls same-origin `/api` routes. Vite proxies those routes in development; FastAPI serves the built React frontend in the ZIP. FastAPI validates the authenticated owner and input, evaluates a rule transition, and commits state through SQLAlchemy.

## Fourteen tables
| Table | Purpose |
| --- | --- |
| users | Unique email, Argon2 hash, token revocation version, moderator flag |
| devices | Supported device catalog |
| problem_categories | Device-specific issues |
| diagnostic_flows | Versioned issue definitions and root node |
| diagnostic_nodes | Unique key per flow, questions and terminal results |
| diagnostic_transitions | Unique answer per node and foreign-key target |
| diagnostic_sessions | Owner, flow, current node, status and optimistic version |
| diagnostic_answers | Ordered active/superseded answer history |
| diagnostic_events | Timestamped checks, corrections, notes, recommendations and status |
| repair_notes | Private timestamped observations |
| repair_cost_comparisons | Owner, optional case link and decimal cost inputs |
| community_cases | Explicit public content, sample flag and moderation state |
| community_votes | Unique user/case votes |
| community_reports | Unique user/case reports with review status |

Foreign keys and indexes support ownership and lookup. Session children cascade on deletion; deleting a session clears its optional comparison link. The initial schema snapshot is frozen so later model changes do not silently alter old migrations.

## Branching and corrections
All flows begin at a hazard question. Each nonterminal node has four explicit answer transitions. The server accepts only the current node or an active previous check. On a correction at position k, old answers at k and later become inactive, a new answer is stored and the chosen transition selects the next node. The prior event history remains visible. A stale version returns 409. Notes remain private and are append-only.

The map is derived from database nodes, transitions and active answers. It shows completed checks, the current check and immediate successor branches. Progress uses completed checks and the longest remaining branch, so it may change when a branch changes.

## Authentication
Argon2 hashes passwords. JWTs include subject, audience, expiry and the stored token version. Cookies are HttpOnly/SameSite=Strict; production requires Secure and a configured signing secret. Logout/password changes revoke prior sessions. Mutations require X-FixPath: 1 and an allowed browser Origin. No cross-origin CORS is enabled.

Public DTOs never expose email, session IDs, private notes or diagnostic records. SQLAlchemy parameterizes database operations, and React escapes user text. Private authorization uses the authenticated server-side owner. Process-local throttles are included, but deployment across workers needs a shared limiter. Password recovery, email verification and MFA are not implemented.

## Extending rules
Add reviewed flows and validate unique keys, targets and acyclicity. Do not overwrite nodes used by active sessions. The current seed does not modify existing flows; create a new migration/version for live rule changes.

## Interface
Motion handles page/question transitions. CSS honors reduced-motion preferences. Native radio inputs, keyboard forms, focus-visible styling, modal focus trapping and a skip link are implemented. SVG highlights identify inspection locations, not faults. Manual browser/layout/accessibility verification remains outstanding.
