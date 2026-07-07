import type { Me } from "../../../store/api";
import { formatWeekRange } from "../calendar-date";

type CalendarHeaderProps = {
  me: Me | undefined;
  weekStart: Date;
  weekEnd: Date;
  onLogout: () => void;
};

export function CalendarHeader({
  me,
  weekStart,
  weekEnd,
  onLogout,
}: CalendarHeaderProps) {
  return (
    <header
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: ["stretch", "center"],
        gap: 3,
        mb: 4,
        flexDirection: ["column", "row"],
      }}
    >
      <div>
        <h1 sx={{ m: 0, fontSize: [4, 5], lineHeight: 1.15 }}>Bookings</h1>
        <p sx={{ mt: 1, mb: 0, color: "secondary", fontSize: 1 }}>
          {formatWeekRange(weekStart, weekEnd)}
        </p>
      </div>
      <div
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {me && <span sx={{ color: "secondary", fontSize: 1 }}>{me.name}</span>}
        <button onClick={onLogout} sx={{ variant: "buttons.border" }}>
          Sign out
        </button>
      </div>
    </header>
  );
}
