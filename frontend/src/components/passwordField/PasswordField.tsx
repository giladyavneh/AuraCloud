import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

const PasswordField: React.FC<PasswordFieldProps> = (props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...props.slotProps,
        input: {
          ...(props.slotProps?.input as object | undefined),
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={visible ? t('common.hidePassword') : t('common.showPassword')} arrow>
                <IconButton
                  size="small"
                  onClick={() => setVisible((v) => !v)}
                  edge="end"
                  tabIndex={-1}
                >
                  {visible
                    ? <EyeSlashIcon size={theme.iconSize.sm} />
                    : <EyeIcon size={theme.iconSize.sm} />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default PasswordField;
