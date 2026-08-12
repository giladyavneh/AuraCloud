import CopyField from "@/components/copyField/CopyField";
import { MonoText } from "@/components/monoText/components/monoText.styled";
import { MCP_INSTALL_COMMAND } from "@/constants";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { TerminalWindowIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

const ConnectAiCommand: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <CopyField
        label={t("settings.connectAi.command.label")}
        value={MCP_INSTALL_COMMAND}
        copyLabel={t("settings.connectAi.command.copy")}
        copiedLabel={t("settings.connectAi.command.copied")}
      >
        <TerminalWindowIcon size={theme.iconSize.sm} color={theme.palette.text.secondary} />
        <MonoText variant="body2">{MCP_INSTALL_COMMAND}</MonoText>
      </CopyField>

      {/* After the command, not before it: the next thing the user does is copy. */}
      <Typography variant="caption" color="textSecondary">
        {t("settings.connectAi.command.hint")}
      </Typography>

      <Typography variant="caption" color="textSecondary">
        {t("settings.connectAi.command.safeToShare")}
      </Typography>

    </Box>
  );
};

export default ConnectAiCommand;
