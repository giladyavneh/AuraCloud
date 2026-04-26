import React from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from '@/components/sideMenu/SideMenu';
import { LayoutRoot, MainContent } from '@/layouts/pageWrapper/pageWrapper.styled';

const PageWrapper: React.FC = () => (
  <LayoutRoot>
    <SideMenu />
    <MainContent>
      <Outlet />
    </MainContent>
  </LayoutRoot>
);

export default PageWrapper;
