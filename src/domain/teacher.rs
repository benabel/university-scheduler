use serde::{Deserialize, Serialize};
use solverforge::prelude::*;

/// TODO — describe this fact.
#[problem_fact]
#[derive(Serialize, Deserialize)]
pub struct Teacher {
    #[planning_id]
    pub id: String,
    #[serde(skip)]
    pub index: usize, // the solver-facing join key
    pub name: String,
    pub availability: [bool; 10],
}

impl Teacher {
    pub fn new(index: usize, name: impl Into<String>, availability: [bool; 10]) -> Self {
        Self {
            id: format!("teacher-{index}"),
            index,
            name: name.into(),
            availability,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_teacher_construction() {
        let fact = Teacher::new(0, "test", Default::default());
        assert_eq!(fact.index, 0);
        assert_eq!(fact.id, "teacher-0");
        assert_eq!(fact.name, "test");
        let _ = &fact.name;
        let _ = &fact.availability;
    }
}
