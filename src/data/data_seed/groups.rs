use crate::domain::Group;

use super::vocabulary::GROUP_NAME_PREFIX;

/// Builds groups with varied availability patterns.
///
/// Creates groups with different availability to simulate
/// real-world constraints where groups may have restricted schedules.
pub(super) fn build_groups(count: usize) -> Vec<Group> {
    (0..count)
        .map(|index| {
            let mut availability = [true; 10];
            // Create simple patterns: even groups unavailable mornings, odd groups unavailable afternoons
            if index % 2 == 0 {
                // Even groups: unavailable in first 3 slots (morning)
                for i in 0..3 {
                    availability[i] = false;
                }
            } else {
                // Odd groups: unavailable in last 3 slots (afternoon)
                for i in 7..10 {
                    availability[i] = false;
                }
            }

            Group::new(index, format!("{GROUP_NAME_PREFIX} {index}"), availability)
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_groups_with_varied_availability() {
        let groups = build_groups(4);
        assert_eq!(groups.len(), 4);

        // Even groups (0, 2) should have morning slots unavailable
        assert!(!groups[0].availability[0]);
        assert!(!groups[0].availability[1]);
        assert!(!groups[0].availability[2]);
        assert!(groups[0].availability[3]); // Afternoon should be available

        // Odd groups (1, 3) should have afternoon slots unavailable
        assert!(groups[1].availability[0]); // Morning should be available
        assert!(!groups[1].availability[7]);
        assert!(!groups[1].availability[8]);
        assert!(!groups[1].availability[9]);
    }
}
