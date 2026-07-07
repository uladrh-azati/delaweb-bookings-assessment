type WeekControlsProps = {
  onPreviousWeek: () => void;
  onCurrentWeek: () => void;
  onNextWeek: () => void;
};

export function WeekControls({
  onPreviousWeek,
  onCurrentWeek,
  onNextWeek,
}: WeekControlsProps) {
  return (
    <div sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <button
        onClick={onPreviousWeek}
        sx={{ variant: "buttons.border", borderRadius: "8px" }}
      >
        Previous
      </button>
      <button
        onClick={onCurrentWeek}
        sx={{ variant: "buttons.border", borderRadius: "8px" }}
      >
        Today
      </button>
      <button
        onClick={onNextWeek}
        sx={{ variant: "buttons.border", borderRadius: "8px" }}
      >
        Next
      </button>
    </div>
  );
}
