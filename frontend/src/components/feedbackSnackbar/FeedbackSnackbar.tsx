import type { FeedbackSnackbarProps } from "@/components/feedbackSnackbar/types/feedbackSnackbar.types";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import React from "react";

const SNACKBAR_DURATION_MS = 4000;

const FeedbackSnackbar: React.FC<FeedbackSnackbarProps> = ({ state, onClose }) => (
  <Snackbar
    open={state.open}
    autoHideDuration={SNACKBAR_DURATION_MS}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <Alert onClose={onClose} severity={state.severity} variant="standard">
      {state.message}
    </Alert>
  </Snackbar>
);

export default FeedbackSnackbar;
