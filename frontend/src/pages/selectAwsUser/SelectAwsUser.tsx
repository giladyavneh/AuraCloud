import AuraLogo from "@/components/auraLogo/AuraLogo";
import PixelBlast from "@/components/pixelBlast/PixelBlast";
import { useAuth } from "@/context/auth/AuthContext";
import { useCompanyAwsUsers, useLinkAwsUser } from "@/hooks/auth.hooks";
import { SignOutIcon } from "@phosphor-icons/react";
import type { AwsUserOption } from "@/services/auth.service";
import {
  BackgroundLayer,
  HeaderBlock,
  LogoBadge,
  SignUpCard,
  SignUpRoot,
} from "@/pages/signUp/components/signUp.styled";
import { UserItem, UserList } from "@/pages/selectAwsUser/components/selectAwsUser.styled";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const SelectAwsUser: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { customer } = useAuth();

  const { logout } = useAuth();
  const companySlug = customer?.companySlug ?? '';
  const { data: awsUsers = [], isLoading, isError } = useCompanyAwsUsers(companySlug);
  const { mutate: doLink, isPending, error } = useLinkAwsUser();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedId) return;
    doLink(selectedId, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    });
  };

  return (
    <SignUpRoot>
      <BackgroundLayer>
        <PixelBlast
          variant="square"
          color={theme.palette.primary.main}
          pixelSize={4}
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.4}
          edgeFade={0.4}
          speed={0.4}
          rippleTrigger="window"
        />
      </BackgroundLayer>

      <SignUpCard elevation={0}>
        <HeaderBlock>
          <LogoBadge>
            <AuraLogo size={theme.iconSize.md} />
          </LogoBadge>
          <Typography variant="h5" color="textPrimary">
            {t('selectAwsUser.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {t('selectAwsUser.subtitle')}
          </Typography>
        </HeaderBlock>

        {isError && <Alert severity="error">{t('selectAwsUser.fetchError')}</Alert>}
        {error && <Alert severity="error">{error.message}</Alert>}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', paddingBlock: 3 }}>
            <CircularProgress size={theme.iconSize.md} />
          </Box>
        ) : awsUsers.length === 0 ? (
          <Alert severity="info">{t('selectAwsUser.noUsers')}</Alert>
        ) : (
          <UserList>
            {awsUsers.map((user: AwsUserOption) => (
              <UserItem
                key={user._id}
                isSelected={selectedId === user.externalId}
                onClick={() => setSelectedId(user.externalId)}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2">{user.name}</Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ fontFamily: theme.typography.fontFamilyMono }}>
                      {user.source}{user.arn ? ` · ${user.arn}` : ''}
                    </Typography>
                  }
                />
              </UserItem>
            ))}
          </UserList>
        )}

        <Button
          variant="contained"
          fullWidth
          disabled={!selectedId || isPending}
          startIcon={isPending && <CircularProgress size={theme.iconSize.xs} color="inherit" />}
          onClick={handleConfirm}
        >
          {isPending ? t('selectAwsUser.confirming') : t('selectAwsUser.confirm')}
        </Button>

        <Button
          variant="text"
          fullWidth
          color="inherit"
          startIcon={<SignOutIcon size={theme.iconSize.sm} />}
          onClick={logout}
          sx={{ color: 'text.secondary' }}
        >
          {t('selectAwsUser.signOut')}
        </Button>

      </SignUpCard>
    </SignUpRoot>
  );
};

export default SelectAwsUser;
