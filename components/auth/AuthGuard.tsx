import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useNavigate, useLocation } from 'react-router-native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { relogin } from '../../services/api';
import { routes } from '../../navigation/routes';

/**
 * AuthGuard component that handles auto-login and navigation
 * Should be rendered inside the router so it has access to navigation
 */
export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const { token, userPojo } = useAppSelector(state => state.cardinalApi);

  useEffect(() => {
    const attemptAutoLogin = async () => {
      try {
        console.log('🔐 [AuthGuard] Checking authentication status...');
        console.log('🔐 [AuthGuard] Current location:', location.pathname);
        console.log('🔐 [AuthGuard] Token present:', !!token);
        console.log('🔐 [AuthGuard] User present:', !!userPojo);

        // If we have credentials and we're on the login page, try to auto-login
        if (token && userPojo) {
          console.log('✅ [AuthGuard] Found saved credentials for user:', userPojo.id);

          try {
            await dispatch(relogin()).unwrap();
            console.log('✅ [AuthGuard] Auto-login successful!');

            // Only navigate if we're currently on the login page
            if (location.pathname === routes.login) {
              console.log('🔀 [AuthGuard] Navigating to home...');
              navigate(routes.home, { replace: true });
            }
          } catch (reloginError) {
            console.error('❌ [AuthGuard] Auto-login failed:', reloginError);
            // If relogin fails and we're not on login page, redirect to login
            if (location.pathname !== routes.login) {
              console.log('🔀 [AuthGuard] Redirecting to login...');
              navigate(routes.login, { replace: true });
            }
          }
        } else {
          console.log('ℹ️ [AuthGuard] No saved credentials found');
          // No credentials and not on login page? Redirect to login
          if (location.pathname !== routes.login) {
            console.log('🔀 [AuthGuard] Redirecting to login...');
            navigate(routes.login, { replace: true });
          }
        }
      } catch (error) {
        console.error('❌ [AuthGuard] Error during auth check:', error);
      } finally {
        setIsChecking(false);
      }
    };

    attemptAutoLogin();
  }, []); // Only run once on mount

  // Show loading screen while checking authentication
  if (isChecking) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 40,
      }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 40,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
        }}>
          <ActivityIndicator size="large" color="#40908e" />
          <Text style={{
            marginTop: 24,
            fontSize: 18,
            fontWeight: '600',
            color: '#333',
            textAlign: 'center',
          }}>
            Checking authentication...
          </Text>
          <Text style={{
            marginTop: 8,
            fontSize: 14,
            color: '#999',
            textAlign: 'center',
          }}>
            Please wait while we verify your credentials
          </Text>
        </View>
      </View>
    );
  }

  // Render children once authentication check is complete
  return <>{children}</>;
};

