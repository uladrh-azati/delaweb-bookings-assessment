import { DURATIONS } from "../calendar.constants";

type DurationSelectorProps = {
  durationMinutes: number;
  isUpdating: boolean;
  onSelectDuration: (durationMinutes: number) => void;
};

export function DurationSelector({
  durationMinutes,
  isUpdating,
  onSelectDuration,
}: DurationSelectorProps) {
  return (
    <div
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
        mb: 3,
      }}
    >
      <span sx={{ color: "secondary", fontSize: 1 }}>Duration</span>
      {DURATIONS.map((duration) => (
        <button
          key={duration}
          onClick={() => onSelectDuration(duration)}
          sx={{
            variant:
              duration === durationMinutes ? "buttons.secondary" : "buttons.border",
            borderRadius: "8px",
            py: 2,
            px: 3,
            fontSize: 1,
          }}
        >
          {duration} min
        </button>
      ))}
      {isUpdating && (
        <span sx={{ color: "secondary", fontSize: 1 }}>Updating...</span>
      )}
    </div>
  );
}
