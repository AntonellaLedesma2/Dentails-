import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import Colors from '../constants/colors';

// Auth
import LoginScreen       from '../screens/auth/LoginScreen';
import TwoFAScreen       from '../screens/auth/TwoFAScreen';
import OAuthLoginScreen  from '../screens/auth/OAuthLoginScreen';

// Admin
import AdminHomeScreen   from '../screens/admin/AdminHomeScreen';
import UsersListScreen   from '../screens/admin/UsersListScreen';
import CreateUserScreen  from '../screens/admin/CreateUserScreen';
import EditUserScreen    from '../screens/admin/EditUserScreen';

// Recepción
import RecepcionHomeScreen from '../screens/recepcion/RecepcionHomeScreen';

// Odontólogo
import OdontologoHomeScreen from '../screens/odontologo/OdontologoHomeScreen';

// Compartidas
import ProfileScreen        from '../screens/shared/ProfileScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import PlaceholderScreen    from '../screens/shared/PlaceholderScreen';

// Pacientes (implementadas)
import PatientsScreen      from '../screens/shared/PatientsScreen';
import PatientDetailScreen from '../screens/shared/PatientDetailScreen';
import PatientFormScreen   from '../screens/shared/PatientFormScreen';

// Turnos
import AppointmentsScreen    from '../screens/shared/AppointmentsScreen';
import AppointmentFormScreen from '../screens/shared/AppointmentFormScreen';

const Stack = createNativeStackNavigator();

const headerOptions = {
  headerStyle: { backgroundColor: Colors.primary },
  headerTintColor: Colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// ─── Pantallas comunes a todos los roles ──────────────────────────────────────
function sharedScreens() {
  return (
    <>
      <Stack.Screen name="Profile"          component={ProfileScreen}         options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="ChangePassword"   component={ChangePasswordScreen}  options={{ title: 'Cambiar contraseña' }} />
      <Stack.Screen name="Patients"         component={PatientsScreen}        options={{ title: 'Pacientes' }} />
      <Stack.Screen name="PatientDetail"    component={PatientDetailScreen}   options={{ title: 'Paciente' }} />
      <Stack.Screen name="PatientForm"      component={PatientFormScreen}     options={({ route }) => ({ title: route.params?.mode === 'edit' ? 'Editar paciente' : 'Nuevo paciente' })} />
      <Stack.Screen name="Agenda"           component={AppointmentsScreen}    options={{ title: 'Agenda' }} />
      <Stack.Screen name="AppointmentForm"  component={AppointmentFormScreen} options={({ route }) => ({ title: route.params?.mode === 'edit' ? 'Editar turno' : 'Nuevo turno' })} />
      <Stack.Screen name="Help"             component={PlaceholderScreen}     options={{ title: 'Ayuda' }} />
    </>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"      component={LoginScreen} />
      <Stack.Screen name="TwoFA"      component={TwoFAScreen}      options={{ headerShown: true, ...headerOptions, title: 'Verificación' }} />
      <Stack.Screen name="OAuthLogin" component={OAuthLoginScreen} options={{ headerShown: true, ...headerOptions, title: 'Iniciando sesión' }} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="AdminHome"  component={AdminHomeScreen}  options={{ title: 'DENTALIS' }} />
      <Stack.Screen name="UsersList"  component={UsersListScreen}  options={{ title: 'Usuarios' }} />
      <Stack.Screen name="CreateUser" component={CreateUserScreen} options={{ title: 'Nuevo usuario' }} />
      <Stack.Screen name="EditUser"   component={EditUserScreen}   options={{ title: 'Editar usuario' }} />
      <Stack.Screen name="Reports"    component={PlaceholderScreen} options={{ title: 'Reportes' }} />
      {sharedScreens()}
    </Stack.Navigator>
  );
}

function RecepcionStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="RecepcionHome"  component={RecepcionHomeScreen} options={{ title: 'DENTALIS' }} />
      <Stack.Screen name="NewPatient"     component={PatientFormScreen}   options={{ title: 'Nuevo paciente' }} />
      <Stack.Screen name="NewAppointment" component={AppointmentFormScreen} options={{ title: 'Nuevo turno' }} />
      <Stack.Screen name="Payments"       component={PlaceholderScreen}   options={{ title: 'Pagos' }} />
      {sharedScreens()}
    </Stack.Navigator>
  );
}

function OdontologoStack() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="OdontologoHome"  component={OdontologoHomeScreen} options={{ title: 'DENTALIS' }} />
      <Stack.Screen name="ClinicalRecords" component={PlaceholderScreen}    options={{ title: 'Fichas clínicas' }} />
      <Stack.Screen name="Treatments"      component={PlaceholderScreen}    options={{ title: 'Tratamientos' }} />
      {sharedScreens()}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : user?.rol === ROLES.ADMINISTRADOR ? (
        <AdminStack />
      ) : user?.rol === ROLES.RECEPCION ? (
        <RecepcionStack />
      ) : (
        <OdontologoStack />
      )}
    </NavigationContainer>
  );
}
