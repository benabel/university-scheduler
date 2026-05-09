# university-scheduler

A SolverForge university timetable optimizer.

## Versioning

- CLI version used to scaffold this project: `2.0.4`
- SolverForge runtime target for this scaffold: `solverforge 0.12.0`
- SolverForge UI target for this scaffold: `solverforge-ui 0.6.5`
- Runtime dependency currently wired into `Cargo.toml`: `crates.io: solverforge 0.12.0`
- Frontend UI dependency currently wired into `Cargo.toml`: `crates.io: solverforge-ui 0.6.5`

This project was scaffolded by `solverforge-cli`, and currently targets `SolverForge 0.12.0` through the configured crate dependency.

## Model

The app schedules 100 lessons for 4 student groups across 40 weekly timeslots
and 10 rooms. Lessons are planning entities; timeslots, teachers, groups, and
rooms are problem facts.

The score type is `HardMediumSoftScore`:

- Hard constraints prevent teacher, group, and room overlaps.
- Medium constraints require every lesson to receive a timeslot and a room.
- Soft constraints are not currently used.

The shipped demo data surface exposes a single deterministic dataset:
`LARGE`.

## Quick Start

```bash
# Start the solver server
solverforge server

# Or run directly
cargo run --release
```

## Development

```bash
# Add a new constraint
solverforge generate constraint my_rule --unary --hard

# Add a domain entity
solverforge generate entity worker --planning-variable shift_idx

# Add a problem fact
solverforge generate fact location

# Remove a resource
solverforge destroy constraint my_rule
```

## Project Structure

| Directory | Purpose |
|-----------|--------|
| `src/domain/` | Planning entities, facts, and solution struct |
| `src/constraints/` | Constraint definitions (scored by the solver) |
| `src/solver/` | Solver service and configuration |
| `src/api/` | HTTP routes and DTOs |
| `src/data/` | Data loading and generation |
| `solverforge.app.toml` | Scaffolded app/domain contract |
| `solver.toml` | Solver configuration (termination, phases) |
