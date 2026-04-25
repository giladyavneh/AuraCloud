import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import SideMenu from '@/components/sideMenu/sideMenu';

const LayoutRoot = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#0b0f19', // color/surface/canvas
});

const MainContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '24px',
  minWidth: 0,
});

const PageWrapper = () => (
  <LayoutRoot>
    <SideMenu />
    <MainContent>
      <Outlet />
    </MainContent>
  </LayoutRoot>
);

export default PageWrapper;
