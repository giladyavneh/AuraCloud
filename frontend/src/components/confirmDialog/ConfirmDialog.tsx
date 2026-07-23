import type { ConfirmDialogProps } from '@/components/confirmDialog/types/confirmDialog.types';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import React from 'react';

/**
 * Generic destructive-confirmation dialog shell, shared by every
 * remove/delete flow. Cancel gets initial focus (never the destructive
 * action) and both Esc and backdrop click are treated as Cancel.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  isPending = false,
  onConfirm,
  onClose,
}) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: theme.palette.surface.base,
            border: `1px solid ${theme.palette.border.default}`,
          },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <DialogContentText color="textSecondary">{body}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" autoFocus>
          {cancelLabel}
        </Button>

        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isPending}
          startIcon={
            isPending ? <CircularProgress size={theme.iconSize.xs} color="inherit" /> : undefined
          }
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
