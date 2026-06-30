import type { Booking } from "../../../store/api";
import { formatTime, timeRange } from "../calendar-date";

type ConfirmHoldDialogProps = {
  activeHold: Booking | null;
  isConfirmingHold: boolean;
  onDismissHold: () => void;
  onConfirmHold: () => void;
};

export function ConfirmHoldDialog({
  activeHold,
  isConfirmingHold,
  onDismissHold,
  onConfirmHold,
}: ConfirmHoldDialogProps) {
  if (!activeHold) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      sx={{
        position: "fixed",
        inset: 0,
        bg: "rgba(16, 24, 40, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        zIndex: 10,
      }}
    >
      <div
        sx={{
          bg: "surface",
          borderRadius: "8px",
          boxShadow: "0 18px 48px rgba(16,24,40,.22)",
          p: 4,
          width: "min(440px, 100%)",
        }}
      >
        <h2 sx={{ mt: 0, mb: 2, fontSize: 4 }}>Confirm booking</h2>
        <p sx={{ color: "secondary", mt: 0, mb: 4, lineHeight: 1.5 }}>
          {activeHold.roomName},{" "}
          {timeRange(activeHold.startTime, activeHold.endTime)}. This hold
          expires at {formatTime(activeHold.expiresAt ?? "")}.
        </p>
        <div sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <button
            onClick={onDismissHold}
            sx={{ variant: "buttons.border", borderRadius: "8px" }}
          >
            Close
          </button>
          <button
            onClick={onConfirmHold}
            disabled={isConfirmingHold}
            sx={{ variant: "buttons.primary", borderRadius: "8px" }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
