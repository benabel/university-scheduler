use crate::domain::Room;

use super::vocabulary::ROOM_NAME_PREFIX;

pub(super) fn build_rooms(count: usize) -> Vec<Room> {
    (0..count)
        .map(|index| Room::new(index, format!("{ROOM_NAME_PREFIX} {index}")))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_rooms() {
        let rooms = build_rooms(6);
        assert_eq!(rooms.len(), 6);
        assert_eq!(rooms[0].id, "room-0");
        assert_eq!(rooms[0].name, "Room 0");
    }
}
