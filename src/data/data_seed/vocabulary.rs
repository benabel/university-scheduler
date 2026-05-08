//! Generator constants and shared university vocabulary.

use std::collections::HashMap;

// Timeslot configuration
pub(super) const LESSON_DURATION_HOURS: u32 = 1;
pub(super) const DAY_START_HOUR: u32 = 8;
pub(super) const DAY_END_HOUR: u32 = 18;
pub(super) const LUNCH_BREAK_START: u32 = 12;
pub(super) const LUNCH_BREAK_END: u32 = 14;

// Large dataset sizes
pub(super) const TIMESLOT_COUNT: usize = 40;
pub(super) const GROUP_COUNT: usize = 4;
pub(super) const ROOM_COUNT: usize = 10;

// Lesson duration bounds
pub(super) const MIN_LESSON_DURATION: u32 = 1;
pub(super) const MAX_LESSON_DURATION: u32 = 2;

/// Subject configuration with hours per week per group and teachers
#[derive(Debug, Clone)]
pub(super) struct Subject {
    pub hours_per_week: usize,
    pub teachers: Vec<&'static str>,
}

/// Classic UK secondary school subjects configuration
/// Each subject has hours_per_week (per group) and a list of teacher names
pub(super) fn subjects() -> HashMap<&'static str, Subject> {
    let mut map = HashMap::new();
    map.insert(
        "English",
        Subject {
            hours_per_week: 4,
            teachers: vec!["Jane Austen", "William Shakespeare"],
        },
    );
    map.insert(
        "Mathematics",
        Subject {
            hours_per_week: 4,
            teachers: vec!["Isaac Newton", "Florence Nightingale"],
        },
    );
    map.insert(
        "Physics",
        Subject {
            hours_per_week: 3,
            teachers: vec!["Marie Curie", "Albert Einstein", "Stephen Hawking"],
        },
    );
    map.insert(
        "Chemistry",
        Subject {
            hours_per_week: 3,
            teachers: vec!["Marie Curie", "Albert Einstein"],
        },
    );
    map.insert(
        "Biology",
        Subject {
            hours_per_week: 3,
            teachers: vec!["Rosalind Franklin", "Charles Darwin", "Jane Goodall"],
        },
    );
    map.insert(
        "Computer Science",
        Subject {
            hours_per_week: 2,
            teachers: vec!["Ada Lovelace", "Alan Turing"],
        },
    );
    map.insert(
        "History",
        Subject {
            hours_per_week: 2,
            teachers: vec!["Jane Austen", "William Shakespeare"],
        },
    );
    map.insert(
        "Geography",
        Subject {
            hours_per_week: 2,
            teachers: vec!["Charles Darwin", "Jane Goodall"],
        },
    );
    map.insert(
        "French",
        Subject {
            hours_per_week: 1,
            teachers: vec!["Marie Curie"],
        },
    );
    map.insert(
        "German",
        Subject {
            hours_per_week: 1,
            teachers: vec!["Albert Einstein"],
        },
    );
    map
}

/// Returns a sorted list of all unique teacher names from the subjects configuration
pub(super) fn teacher_names() -> Vec<&'static str> {
    let subjects = subjects();
    let names: Vec<&str> = subjects
        .values()
        .flat_map(|s| s.teachers.iter())
        .copied()
        .collect();
    // Remove duplicates and sort for deterministic order
    let mut unique: Vec<&str> = names.into_iter().collect();
    unique.sort();
    unique.dedup();
    unique
}

/// Returns the index of a teacher name in the teacher_names list
pub(super) fn teacher_index(name: &str) -> usize {
    teacher_names().iter().position(|&n| n == name).unwrap()
}

// Entity name patterns
pub(super) const GROUP_NAME_PREFIX: &str = "Group";
pub(super) const ROOM_NAME_PREFIX: &str = "Room";
