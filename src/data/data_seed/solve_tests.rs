use solverforge::{ConstraintSet, SolverEvent, SolverManager};

use super::{generate, DemoData};
use crate::domain::Plan;

// Static manager — must be 'static for retained job execution.
static MANAGER: SolverManager<Plan> = SolverManager::new();

fn schedule() -> Plan {
    generate(DemoData::Large)
}

/// Slow end-to-end acceptance test for the standard dataset.
///
/// This test verifies that the solver can find a feasible solution for the
/// standard demo dataset, ensuring that all constraints are satisfied and
/// the score is valid.
#[test]
#[ignore = "slow acceptance test for the standard dataset"]
fn standard_demo_solves_to_feasible_terminal_state() {
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

    // Hard score must be 0 (feasible) - no hard constraints broken
    assert_eq!(
        score.hard(),
        solverforge::HardMediumSoftScore::ZERO.hard(),
        "Expected feasible solution (hard score = 0), but got: {}",
        score
    );

    // Debug: print constraint breakdown if hard score is not zero
    if let Some(solution) = completed_solution {
        if score.hard() != solverforge::HardMediumSoftScore::ZERO.hard() {
            let constraints = crate::constraints::create_constraints();
            let analyses = constraints.evaluate_detailed(&solution);
            let hard_breakdown: Vec<_> = analyses
                .into_iter()
                .filter(|analysis| {
                    analysis.score.hard() != solverforge::HardMediumSoftScore::ZERO.hard()
                })
                .map(|analysis| format!("{}={}", analysis.constraint_ref.name, analysis.score))
                .collect();
            eprintln!("hard breakdown: {}", hard_breakdown.join(", "));
        }

        // Print final stats
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
        eprintln!(
            "Solution: {} lessons, {} timeslots assigned, {} rooms assigned",
            lesson_count, assigned_timeslots, assigned_rooms
        );
    }

    MANAGER.delete(job_id).expect("delete completed job");
}
