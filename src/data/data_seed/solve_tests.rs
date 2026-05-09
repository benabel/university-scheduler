use solverforge::{ConstraintSet, SolverEvent, SolverManager};

use super::{generate, DemoData};
use crate::domain::Plan;

// Static manager — must be 'static for retained job execution.
static MANAGER: SolverManager<Plan> = SolverManager::new();

fn schedule() -> Plan {
    generate(DemoData::Large)
}

/// Slow end-to-end acceptance test for the large dataset.
///
/// This verifies that the solver can find a fully assigned zero-score timetable,
/// not merely a hard-feasible empty assignment.
#[test]
#[ignore = "slow acceptance test for the large dataset"]
fn large_demo_solves_to_assigned_zero_score() {
    let plan = schedule();
    let (job_id, mut receiver) = MANAGER.solve(plan).expect("job should start");
    let mut completed_score = None;
    let mut completed_solution = None;

    while let Some(event) = receiver.blocking_recv() {
        match event {
            SolverEvent::Completed { solution, .. } => {
                completed_score = solution.score;
                completed_solution = Some(solution);
                break;
            }
            SolverEvent::Failed { error, .. } => {
                panic!("demo solve failed unexpectedly: {error}");
            }
            _ => {}
        }
    }

    let score = completed_score.expect("expected a completed score");
    let solution = completed_solution.expect("expected a completed solution");

    // The best solution must satisfy both the hard feasibility rules and the
    // medium-level assignment requirements.
    assert_eq!(
        score,
        solverforge::HardMediumSoftScore::ZERO,
        "Expected zero-score solution, but got: {}",
        score
    );

    let lesson_count = solution.lessons.len();
    let assigned_timeslots = solution
        .lessons
        .iter()
        .filter(|l| l.timeslot_idx.is_some())
        .count();
    let assigned_rooms = solution
        .lessons
        .iter()
        .filter(|l| l.room_idx.is_some())
        .count();

    assert_eq!(
        assigned_timeslots, lesson_count,
        "Every lesson must have a timeslot assignment"
    );
    assert_eq!(
        assigned_rooms, lesson_count,
        "Every lesson must have a room assignment"
    );

    let constraints = crate::constraints::create_constraints();
    let non_zero_constraints: Vec<_> = constraints
        .evaluate_detailed(&solution)
        .into_iter()
        .filter(|analysis| analysis.score != solverforge::HardMediumSoftScore::ZERO)
        .map(|analysis| format!("{}={}", analysis.constraint_ref.name, analysis.score))
        .collect();
    assert!(
        non_zero_constraints.is_empty(),
        "Expected all constraints to score zero, got: {}",
        non_zero_constraints.join(", ")
    );

    eprintln!(
        "Solution: {} lessons, {} timeslots assigned, {} rooms assigned",
        lesson_count, assigned_timeslots, assigned_rooms
    );

    MANAGER.delete(job_id).expect("delete completed job");
}
