use crate::domain::Lesson;

use super::vocabulary::{subjects, teacher_index, MAX_LESSON_DURATION, MIN_LESSON_DURATION};

/// Builds lessons for all groups based on subject configuration.
///
/// For each group, creates lessons for all subjects with their allocated hours_per_week.
/// Each lesson is assigned to a group and a teacher (round-robin from subject's teacher list).
/// Each lesson has a duration of 1 or 2 hours.
///
/// Teacher assignment: for a given subject, group 0 gets teachers[0], group 1 gets teachers[1],
/// etc. (wrapping around if there are more groups than teachers for that subject).
///
/// Total lessons = GROUP_COUNT * sum(hours_per_week for all subjects)
/// With 4 groups and current config: 4 * (4+4+3+3+3+2+2+2+1+1) = 4 * 25 = 100 lessons
pub(super) fn build_lessons(group_count: usize) -> Vec<Lesson> {
    let subjects = subjects();
    let mut lessons = Vec::new();
    let mut lesson_index = 0;

    // For each group
    for group_idx in 0..group_count {
        // For each subject, create hours_per_week lessons
        for (subject_name, subject_config) in &subjects {
            // Determine which teacher to use for this subject and group
            // Use round-robin: group_idx % number_of_teachers_for_subject
            let teacher_name = subject_config.teachers[group_idx % subject_config.teachers.len()];
            let teacher_idx = teacher_index(teacher_name);

            for lesson_num in 0..subject_config.hours_per_week {
                // Vary duration: mostly 1 hour, some 2 hours
                let duration = if lesson_num % 4 == 0 {
                    MAX_LESSON_DURATION
                } else {
                    MIN_LESSON_DURATION
                };

                lessons.push(Lesson::new(
                    lesson_index,
                    subject_name.to_string(),
                    group_idx,
                    Some(teacher_idx),
                    duration,
                ));
                lesson_index += 1;
            }
        }
    }

    lessons
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_lessons() {
        let lessons = build_lessons(4);
        // Total lessons: 4 groups * (4+4+3+3+3+2+2+2+1+1) = 4 * 25 = 100
        assert_eq!(lessons.len(), 100);
    }

    #[test]
    fn test_all_groups_have_all_subjects() {
        let lessons = build_lessons(4);
        let subjects = subjects();
        let subject_names: Vec<&str> = subjects.keys().cloned().collect();

        // Check each group has lessons for all subjects
        for group_idx in 0..4 {
            let group_lessons: Vec<_> = lessons
                .iter()
                .filter(|l| l.group_idx == group_idx)
                .collect();

            for subject_name in &subject_names {
                let subject_lessons: Vec<_> = group_lessons
                    .iter()
                    .filter(|l| l.subject == *subject_name)
                    .collect();

                let expected_count = subjects.get(*subject_name).unwrap().hours_per_week;
                assert_eq!(
                    subject_lessons.len(),
                    expected_count,
                    "Group {} should have {} lessons for {}",
                    group_idx,
                    expected_count,
                    subject_name
                );
            }
        }
    }

    #[test]
    fn test_teacher_assignment() {
        let lessons = build_lessons(4);

        // For English: teachers = ["Jane Austen", "William Shakespeare"]
        // Group 0 -> Jane Austen (index 4), Group 1 -> William Shakespeare (index 11)
        // Group 2 -> Jane Austen (index 4), Group 3 -> William Shakespeare (index 11)
        let english_lessons: Vec<_> = lessons.iter().filter(|l| l.subject == "English").collect();

        // English has 4 hours_per_week * 4 groups = 16 lessons
        assert_eq!(english_lessons.len(), 16);

        // Check teacher assignment pattern for English
        for group_idx in 0..4 {
            let group_english: Vec<_> = english_lessons
                .iter()
                .filter(|l| l.group_idx == group_idx)
                .collect();

            let expected_teacher_idx = if group_idx % 2 == 0 {
                teacher_index("Jane Austen") // index 4
            } else {
                teacher_index("William Shakespeare") // index 11
            };

            for lesson in group_english {
                assert_eq!(lesson.teacher_idx, Some(expected_teacher_idx));
            }
        }
    }

    #[test]
    fn test_lesson_duration() {
        let lessons = build_lessons(4);
        for lesson in &lessons {
            assert!(lesson.duration >= MIN_LESSON_DURATION);
            assert!(lesson.duration <= MAX_LESSON_DURATION);
        }
    }

    #[test]
    fn test_subjects_are_classic_uk_school() {
        let subjects = subjects();
        let subject_names: Vec<&str> = subjects.keys().cloned().collect();

        assert!(subject_names.contains(&"Mathematics"));
        assert!(subject_names.contains(&"Physics"));
        assert!(subject_names.contains(&"Chemistry"));
        assert!(subject_names.contains(&"Biology"));
        assert!(subject_names.contains(&"Computer Science"));
        assert!(subject_names.contains(&"English"));
        assert!(subject_names.contains(&"History"));
        assert!(subject_names.contains(&"Geography"));
        assert!(subject_names.contains(&"French"));
        assert!(subject_names.contains(&"German"));
        assert_eq!(subject_names.len(), 10);
    }

    #[test]
    fn test_total_lessons_per_group() {
        let lessons = build_lessons(4);
        // Each group should have 25 lessons (sum of hours_per_week)
        for group_idx in 0..4 {
            let group_lessons: Vec<_> = lessons
                .iter()
                .filter(|l| l.group_idx == group_idx)
                .collect();
            assert_eq!(group_lessons.len(), 25);
        }
    }

    #[test]
    fn test_all_lessons_have_teacher() {
        let lessons = build_lessons(4);
        for lesson in &lessons {
            assert!(
                lesson.teacher_idx.is_some(),
                "Lesson {} has no teacher",
                lesson.id
            );
        }
    }
}
