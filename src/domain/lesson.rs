use serde::{Deserialize, Serialize};
use solverforge::prelude::*;

/// TODO — describe this entity.
#[planning_entity]
#[derive(Serialize, Deserialize)]
pub struct Lesson {
    #[planning_id]
    pub id: String,
    #[serde(skip)]
    pub index: usize, // the solver-facing join key
    pub subject: String,
    pub group_idx: usize,
    pub teacher_idx: Option<usize>,
    pub duration: u32,
    // @solverforge:begin entity-variables
    #[planning_variable(value_range_provider = "timeslots", allows_unassigned = false)]
    pub timeslot_idx: Option<usize>,
    #[planning_variable(value_range_provider = "rooms", allows_unassigned = false)]
    pub room_idx: Option<usize>,
    // @solverforge:end entity-variables
}

impl Lesson {
    pub fn new(
        index: usize,
        subject: String,
        group_idx: usize,
        teacher_idx: Option<usize>,
        duration: u32,
    ) -> Self {
        Self {
            id: format!("lesson-{index}"),
            index,
            subject,
            group_idx,
            teacher_idx,
            duration,
            // @solverforge:begin entity-variable-init
            timeslot_idx: None,
            room_idx: None,
            // @solverforge:end entity-variable-init
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lesson_construction() {
        let entity = Lesson::new(
            0,
            "test".to_string(),
            Default::default(),
            None,
            Default::default(),
        );
        assert_eq!(entity.id, "lesson-0");
        let _ = &entity.subject;
        let _ = &entity.group_idx;
        let _ = &entity.teacher_idx;
        let _ = &entity.duration;
    }
}
