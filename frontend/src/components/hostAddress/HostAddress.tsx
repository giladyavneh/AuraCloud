import type { HostAddressProps } from "@/components/hostAddress/types/hostAddress.types";
import { MonoText } from "@/components/monoText/components/monoText.styled";
import { splitHostLabels } from "@/helpers/redirectUri.helpers";
import Box from "@mui/material/Box";
import { visuallyHidden } from "@mui/utils";
import React from "react";

/** Inline: the caller owns the mono block this sits in, and whatever follows it there. */
const HostAddress: React.FC<HostAddressProps> = ({ host }) => {
  const hostLabels = splitHostLabels(host);

  return (
    <>
      {/* The dim/bright split reads as fragments, so the address is announced whole. */}
      <Box component="span" sx={visuallyHidden}>
        {host}
      </Box>

      <Box component="span" aria-hidden="true">
        {hostLabels.dim && (
          <MonoText component="span" variant="body2" isDimmed>
            {hostLabels.dim}
          </MonoText>
        )}
        {hostLabels.emphasised}
      </Box>

    </>
  );
};

export default HostAddress;
