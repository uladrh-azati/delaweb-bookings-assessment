import type { Room } from "../../../store/api";

type RoomSelectorProps = {
  rooms: Room[];
  roomId: string;
  onSelectRoom: (roomId: string) => void;
};

export function RoomSelector({
  rooms,
  roomId,
  onSelectRoom,
}: RoomSelectorProps) {
  return (
    <div sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelectRoom(room.id)}
          sx={{
            variant: room.id === roomId ? "buttons.primary" : "buttons.border",
            borderRadius: "8px",
          }}
        >
          {room.name}
        </button>
      ))}
    </div>
  );
}
