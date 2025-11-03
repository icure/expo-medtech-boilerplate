import React from 'react';
import {View} from 'react-native';
import {Outlet} from 'react-router-native';
import {AuthGuard} from '../auth/AuthGuard';

export const Layout = () => (
  <AuthGuard>
    <View>
      <Outlet />
    </View>
  </AuthGuard>
);
