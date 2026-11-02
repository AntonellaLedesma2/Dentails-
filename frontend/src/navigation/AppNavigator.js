import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth }          from '../context/AuthContext';
import { ROLES }            from '../constants/roles';
import Colors               from '../constants/colors';
import { withWorkspace }    from '../components/WorkspaceShell';
import RoleDashboardScreen  from '../screens/shared/RoleDashboardScreen';

// Auth
import LoginScreen       from '../screens/auth/LoginScreen';
import TwoFAScreen       from '../screens/auth/TwoFAScreen';
import OAuthLoginScreen  from '../screens/auth/OAuthLoginScreen';
import PatientRegisterScreen from '../screens/auth/PatientRegisterScreen';

// Admin
import UsersListScreen    from '../screens/admin/UsersListScreen';
import CreateUserScreen   from '../screens/admin/CreateUserScreen';
import EditUserScreen     from '../screens/admin/EditUserScreen';
import ReportsScreen      from '../screens/admin/ReportsScreen';
import TreatmentCatalogScreen from '../screens/admin/TreatmentCatalogScreen';
import SalesScreen        from '../screens/admin/SalesScreen';
import PaymentMethodsScreen from '../screens/admin/PaymentMethodsScreen';
import PaymentDetailScreen from '../screens/recepcion/PaymentDetailScreen';

// Recepción
import PaymentsScreen     from '../screens/recepcion/PaymentsScreen';
import NewPaymentScreen   from '../screens/recepcion/NewPaymentScreen';

// Odontólogo
import TreatmentsScreen     from '../screens/odontologo/TreatmentsScreen';
import TreatmentFormScreen  from '../screens/odontologo/TreatmentFormScreen';
import ClinicalRecordScreen from '../screens/odontologo/ClinicalRecordScreen';
import ClinicalRecordEditScreen from '../screens/odontologo/ClinicalRecordEditScreen';

// Compartidas
import ProfileScreen        from '../screens/shared/ProfileScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import PlaceholderScreen    from '../screens/shared/PlaceholderScreen';
import PatientsScreen       from '../screens/shared/PatientsScreen';
import PatientDetailScreen  from '../screens/shared/PatientDetailScreen';
import PatientFormScreen    from '../screens/shared/PatientFormScreen';
import AppointmentsScreen   from '../screens/shared/AppointmentsScreen';
import AppointmentFormScreen from '../screens/shared/AppointmentFormScreen';
import AppointmentRequestsScreen from '../screens/shared/AppointmentRequestsScreen';
import PatientAppointmentRequestScreen from '../screens/shared/PatientAppointmentRequestScreen';

const Stack = createNativeStackNavigator();

// Headers ocultos para las pantallas que usan WorkspaceShell (tienen su propio header)
const noHeader   = { headerShown: false };
const blueHeader = {
  headerStyle:      { backgroundColor: Colors.primary },
  headerTintColor:  Colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// ─── Home wrappers con WorkspaceShell ─────────────────────────────────────────
// Cada home envuelve RoleDashboardScreen con el shell de su rol
function AdminHomeScreen(props)      { return <RoleDashboardScreen role={ROLES.ADMINISTRADOR} {...props} />; }
function RecepcionHomeScreen(props)  { return <RoleDashboardScreen role={ROLES.RECEPCION}     {...props} />; }
function OdontologoHomeScreen(props) { return <RoleDashboardScreen role={ROLES.ODONTOLOGO}    {...props} />; }

const AdminHomeWrapped      = withWorkspace(AdminHomeScreen,      ROLES.ADMINISTRADOR);
const RecepcionHomeWrapped  = withWorkspace(RecepcionHomeScreen,  ROLES.RECEPCION);
const OdontologoHomeWrapped = withWorkspace(OdontologoHomeScreen, ROLES.ODONTOLOGO);

// Pantallas de lista también con shell
const PatientsWrapped      = withWorkspace(PatientsScreen,      null); // null = heredará del shell parent
const AppointmentsWrapped  = withWorkspace(AppointmentsScreen,  null);
const AppointmentRequestsWrapped = withWorkspace(AppointmentRequestsScreen, null);
const UsersListWrapped     = withWorkspace(UsersListScreen,      ROLES.ADMINISTRADOR);
function DentistsDirectory(props) { return <UsersListScreen {...props} roleFilter="odontologo" hideCreate />; }
function ClinicalRecordsDirectory(props) { return <PatientsScreen {...props} clinicalMode />; }
const DentistsWrapped       = withWorkspace(DentistsDirectory, ROLES.ADMINISTRADOR);
const ReportsWrapped       = withWorkspace(ReportsScreen,        ROLES.ADMINISTRADOR);
const AdminPaymentsWrapped = withWorkspace(PaymentsScreen,       ROLES.ADMINISTRADOR);
const ReceptionPaymentsWrapped = withWorkspace(PaymentsScreen,   ROLES.RECEPCION);
const AdminCatalogWrapped  = withWorkspace(TreatmentCatalogScreen, ROLES.ADMINISTRADOR);
const SalesWrapped         = withWorkspace(SalesScreen, ROLES.ADMINISTRADOR);
const PaymentMethodsWrapped = withWorkspace(PaymentMethodsScreen, ROLES.ADMINISTRADOR);
const TreatmentsWrapped    = withWorkspace(TreatmentsScreen,     ROLES.ODONTOLOGO);
const ClinicalRecordWrapped = withWorkspace(ClinicalRecordScreen, ROLES.ODONTOLOGO);
const ClinicalRecordsListWrapped = withWorkspace(ClinicalRecordsDirectory, ROLES.ODONTOLOGO);
function UsuarioHome(props) { return <RoleDashboardScreen role={ROLES.USUARIO} {...props} />; }
const UsuarioHomeWrapped = withWorkspace(UsuarioHome, ROLES.USUARIO);

// ─── Pantallas secundarias (usan header nativo azul) ──────────────────────────
function SecondaryScreens() {
  return (
    <>
      <Stack.Screen name="Profile"          component={ProfileScreen}         options={{ ...blueHeader, title: 'Mi perfil' }} />
      <Stack.Screen name="ChangePassword"   component={ChangePasswordScreen}  options={{ ...blueHeader, title: 'Cambiar contraseña' }} />
      <Stack.Screen name="PatientDetail"    component={PatientDetailScreen}   options={{ headerShown: true, ...blueHeader, title: 'Paciente' }} />
      <Stack.Screen name="PatientForm"      component={PatientFormScreen}
        options={({ route }) => ({ headerShown: true, ...blueHeader, title: route.params?.mode === 'edit' ? 'Editar paciente' : 'Nuevo paciente' })} />
      <Stack.Screen name="AppointmentForm"  component={AppointmentFormScreen}
        options={({ route }) => ({ ...blueHeader, title: route.params?.mode === 'edit' ? 'Editar turno' : 'Nuevo turno' })} />
      <Stack.Screen name="TreatmentForm"    component={TreatmentFormScreen}
        options={({ route }) => ({ ...blueHeader, title: route.params?.mode === 'edit' ? 'Editar tratamiento' : 'Nuevo tratamiento' })} />
      <Stack.Screen name="NewPayment"       component={NewPaymentScreen}      options={{ ...blueHeader, title: 'Registrar pago' }} />
      <Stack.Screen name="CreateUser"       component={CreateUserScreen}      options={{ ...blueHeader, title: 'Nuevo usuario' }} />
      <Stack.Screen name="EditUser"         component={EditUserScreen}        options={{ headerShown: true, ...blueHeader, title: 'Editar usuario' }} />
      <Stack.Screen name="PaymentDetail"    component={PaymentDetailScreen}    options={{ ...blueHeader, title: 'Detalle de cuenta' }} />
      <Stack.Screen name="Help"             component={PlaceholderScreen}     options={{ ...blueHeader, title: 'Ayuda' }} />
    </>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="Login"      component={LoginScreen} />
      <Stack.Screen name="Register"   component={PatientRegisterScreen} options={{ headerShown: true, ...blueHeader, title: 'Crear cuenta' }} />
      <Stack.Screen name="TwoFA"      component={TwoFAScreen}      options={{ headerShown: true, ...blueHeader, title: 'Verificación' }} />
      <Stack.Screen name="OAuthLogin" component={OAuthLoginScreen} options={{ headerShown: true, ...blueHeader, title: 'Iniciando sesión' }} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="AdminHome"   component={AdminHomeWrapped}   />
      <Stack.Screen name="UsersList"   component={UsersListWrapped}   />
      <Stack.Screen name="Reports"     component={ReportsWrapped}     />
      <Stack.Screen name="TreatmentCatalog" component={AdminCatalogWrapped} />
      <Stack.Screen name="Dentists" component={DentistsWrapped} />
      <Stack.Screen name="Payments" component={AdminPaymentsWrapped} />
      <Stack.Screen name="Sales" component={SalesWrapped} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsWrapped} />
      <Stack.Screen name="Patients"    component={PatientsWrapped}    />
      <Stack.Screen name="Agenda"      component={AppointmentsWrapped}/>
      <Stack.Screen name="AppointmentRequests" component={AppointmentRequestsWrapped} />
      <Stack.Screen name="NewPatient"  component={PatientFormScreen}  options={{ headerShown: true, ...blueHeader, title: 'Nuevo paciente' }} />
      <Stack.Screen name="NewAppointment" component={AppointmentFormScreen} options={{ headerShown: true, ...blueHeader, title: 'Nuevo turno' }} />
      {SecondaryScreens()}
    </Stack.Navigator>
  );
}

function RecepcionStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="RecepcionHome"  component={RecepcionHomeWrapped}  />
      <Stack.Screen name="Agenda"         component={AppointmentsWrapped}   />
      <Stack.Screen name="AppointmentRequests" component={AppointmentRequestsWrapped} />
      <Stack.Screen name="Patients"       component={PatientsWrapped}       />
      <Stack.Screen name="Payments"       component={ReceptionPaymentsWrapped} />
      <Stack.Screen name="NewPatient"     component={PatientFormScreen}     options={{ headerShown: true, ...blueHeader, title: 'Nuevo paciente' }} />
      <Stack.Screen name="NewAppointment" component={AppointmentFormScreen} options={{ headerShown: true, ...blueHeader, title: 'Nuevo turno' }} />
      {SecondaryScreens()}
    </Stack.Navigator>
  );
}

function OdontologoStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="OdontologoHome"  component={OdontologoHomeWrapped}  />
      <Stack.Screen name="Agenda"          component={AppointmentsWrapped}    />
      <Stack.Screen name="Patients"        component={PatientsWrapped}        />
      <Stack.Screen name="Treatments"      component={TreatmentsWrapped}      />
      <Stack.Screen name="ClinicalRecords" component={ClinicalRecordWrapped}  />
      <Stack.Screen name="ClinicalRecordsList" component={ClinicalRecordsListWrapped} />
      <Stack.Screen name="ClinicalRecordEdit" component={ClinicalRecordEditScreen} options={{ ...blueHeader, title: 'Editar antecedentes' }} />
      {SecondaryScreens()}
    </Stack.Navigator>
  );
}

function UsuarioStack() {
  return (
    <Stack.Navigator screenOptions={noHeader}>
      <Stack.Screen name="PatientAppointmentRequest" component={PatientAppointmentRequestScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, isAuthenticated, user } = useAuth();
  if (isLoading) return <LoadingScreen />;

  let roleNavigator = <AuthStack />;
  if (isAuthenticated && user?.rol === ROLES.ADMINISTRADOR) roleNavigator = <AdminStack />;
  else if (isAuthenticated && user?.rol === ROLES.RECEPCION) roleNavigator = <RecepcionStack />;
  else if (isAuthenticated && user?.rol === ROLES.ODONTOLOGO) roleNavigator = <OdontologoStack />;
  else if (isAuthenticated && user?.rol === ROLES.USUARIO) roleNavigator = <UsuarioStack />;

  return (
    <NavigationContainer>
      {roleNavigator}
    </NavigationContainer>
  );
}
