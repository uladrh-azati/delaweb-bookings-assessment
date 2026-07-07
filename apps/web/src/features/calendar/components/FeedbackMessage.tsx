type FeedbackMessageProps = {
  message: string;
};

export function FeedbackMessage({ message }: FeedbackMessageProps) {
  if (!message) return null;

  return (
    <div
      sx={{
        mb: 3,
        px: 3,
        py: 2,
        borderRadius: "8px",
        bg: "warning-red-3",
        color: "warning-red-1",
        fontSize: 1,
      }}
    >
      {message}
    </div>
  );
}
