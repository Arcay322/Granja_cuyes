import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // Buscar token en localStorage (si "recordarme" estaba marcado) o en sessionStorage
  const isAuth = !!localStorage.getItem('token') || !!sessionStorage.getItem('token');
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
