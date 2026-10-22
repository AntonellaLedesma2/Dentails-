import React from 'react';
import { ROLES } from '../../constants/roles';
import RoleDashboardScreen from '../shared/RoleDashboardScreen';

export default function AdminHomeScreen(props) {
  return <RoleDashboardScreen {...props} role={ROLES.ADMINISTRADOR} />;
}
