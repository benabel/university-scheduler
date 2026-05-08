use serde::{Deserialize, Serialize};
use solverforge::prelude::*;

/// TODO — describe this fact.
#[problem_fact]
#[derive(Serialize, Deserialize)]
pub struct Room {
    #[planning_id]
    pub id: String,
    #[serde(skip)]
    pub index: usize, // the solver-facing join key
    pub name: String,
}

impl Room {
    pub fn new(index: usize, name: impl Into<String>) -> Self {
        Self {
            id: format!("room-{index}"),
            index,
            name: name.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_room_construction() {
        let fact = Room::new(0, "test");
        assert_eq!(fact.id, "room-0");
        assert_eq!(fact.name, "test");
    }
}
