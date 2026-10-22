import React from 'react';
import { ROLES } from '../../constants/roles';
import RoleDashboardScreen from '../shared/RoleDashboardScreen';

export default function RecepcionHomeScreen(props) {
  return <RoleDashboardScreen {...props} role={ROLES.RECEPCION} />;
}
