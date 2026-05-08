use crate::domain::Teacher;

use super::vocabulary::teacher_names;

/// Builds teachers with varied availability patterns.
/// Each teacher is created from the teacher_names() list with their full name.
pub(super) fn build_teachers() -> Vec<Teacher> {
    teacher_names()
        .iter()
        .enumerate()
        .map(|(index, name)| {
            // Create a simple availability pattern
            let mut availability = [true; 10];
            availability[index % availability.len()] = false;

            Teacher::new(index, name.to_string(), availability)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_teachers() {
        let teachers = build_teachers();
        let teacher_names_list = teacher_names();
        assert_eq!(teachers.len(), teacher_names_list.len());

        // Each teacher has one slot unavailable based on index % availability.len()
        for (index, teacher) in teachers.iter().enumerate() {
            let unavailable_slot = index % teacher.availability.len();
            assert!(!teacher.availability[unavailable_slot]);
        }
    }

    #[test]
    fn test_teacher_names() {
        let teachers = build_teachers();
        assert_eq!(teachers.len(), 12);
        // Teachers are sorted alphabetically
        assert_eq!(teachers[0].name, "Ada Lovelace");
        assert_eq!(teachers[1].name, "Alan Turing");
        assert_eq!(teachers[2].name, "Albert Einstein");
        assert_eq!(teachers[3].name, "Charles Darwin");
        assert_eq!(teachers[4].name, "Florence Nightingale");
        assert_eq!(teachers[5].name, "Isaac Newton");
        assert_eq!(teachers[6].name, "Jane Austen");
        assert_eq!(teachers[7].name, "Jane Goodall");
        assert_eq!(teachers[8].name, "Marie Curie");
        assert_eq!(teachers[9].name, "Rosalind Franklin");
        assert_eq!(teachers[10].name, "Stephen Hawking");
        assert_eq!(teachers[11].name, "William Shakespeare");
    }

    #[test]
    fn test_teacher_names_from_subjects() {
        let names = teacher_names();
        assert_eq!(names.len(), 12);
        assert!(names.contains(&"Marie Curie"));
        assert!(names.contains(&"Alan Turing"));
        assert!(names.contains(&"William Shakespeare"));
    }

    #[test]
    fn test_gender_balance() {
        let teachers = build_teachers();
        let female_teachers = [
            "Marie Curie",
            "Ada Lovelace",
            "Rosalind Franklin",
            "Florence Nightingale",
            "Jane Austen",
            "Jane Goodall",
        ];
        let male_teachers = [
            "Isaac Newton",
            "Albert Einstein",
            "Charles Darwin",
            "Alan Turing",
            "Stephen Hawking",
            "William Shakespeare",
        ];

        let females: Vec<_> = teachers
            .iter()
            .filter(|t| female_teachers.contains(&t.name.as_str()))
            .collect();
        let males: Vec<_> = teachers
            .iter()
            .filter(|t| male_teachers.contains(&t.name.as_str()))
            .collect();

        assert_eq!(females.len(), 6);
        assert_eq!(males.len(), 6);
    }
}
