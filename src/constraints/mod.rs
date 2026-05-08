#![cfg_attr(rustfmt, rustfmt_skip)]
/* Constraint definitions.

Add constraint modules with `solverforge generate constraint ...`.
The neutral shell starts with an empty constraint set. */

use crate::domain::Plan;
use solverforge::prelude::*;

pub use self::assemble::create_constraints;

// @solverforge:begin constraint-modules
mod no_group_conflict;
mod no_teacher_conflict;
mod no_room_conflict;
// @solverforge:end constraint-modules

mod assemble {
    use super::*;

    pub fn create_constraints() -> impl ConstraintSet<Plan, HardMediumSoftScore> {
        // @solverforge:begin constraint-calls
        (
            no_group_conflict::constraint(),
            no_teacher_conflict::constraint(),
            no_room_conflict::constraint(),
        )
        // @solverforge:end constraint-calls
    }
}
