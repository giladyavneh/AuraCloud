export interface SnackbarState {
  open: boolean;
  severity: "success" | "error";
  message: string;
}

export interface FeedbackSnackbarProps {
  state: SnackbarState;
  onClose: () => void;
}
