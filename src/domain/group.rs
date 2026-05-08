use serde::{Deserialize, Serialize};
use solverforge::prelude::*;

/// TODO — describe this fact.
#[problem_fact]
#[derive(Serialize, Deserialize)]
pub struct Group {
    #[planning_id]
    pub id: String,
    #[serde(skip)]
    pub index: usize, // the solver-facing join key
    pub name: String,
    pub availability: [bool; 10],
}

impl Group {
    pub fn new(index: usize, name: impl Into<String>, availability: [bool; 10]) -> Self {
        Self {
            id: format!("group-{index}"),
            index: index,
            name: name.into(),
            availability,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_group_construction() {
        let fact = Group::new(0, "test", Default::default());
        assert_eq!(fact.index, 0);
        assert_eq!(fact.id, "group-0");
        assert_eq!(fact.name, "test");
        let _ = &fact.id;
        let _ = &fact.availability;
    }
}
