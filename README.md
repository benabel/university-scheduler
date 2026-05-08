# university-scheduler

A SolverForge constraint optimization project (scaffold: `neutral scaffold`).

## Versioning

- CLI version used to scaffold this project: `2.0.1`
- SolverForge runtime target for this scaffold: `solverforge 0.9.1`
- SolverForge UI target for this scaffold: `solverforge-ui 0.6.3`
- SolverForge maps target for this scaffold: `solverforge-maps 2.1.3`
- Runtime dependency currently wired into `Cargo.toml`: `crates.io: solverforge 0.9.1`
- Frontend UI dependency currently wired into `Cargo.toml`: `crates.io: solverforge-ui 0.6.3`
- Maps dependency currently wired into `Cargo.toml`: `crates.io: solverforge-maps 2.1.3`

This project was scaffolded by `solverforge-cli`, and it currently targets `SolverForge crate target 0.9.1` through the configured crate dependency targets.

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
