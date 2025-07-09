import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '../utils/mui';

const MainLayout = () => {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Granja de Cuyes
          </Typography>
          <Button color="inherit" component={Link} to="/">Dashboard</Button>
          <Button color="inherit" component={Link} to="/cuyes">Cuyes</Button>
          <Button color="inherit" component={Link} to="/alimentos">Alimentación</Button>
          <Button color="inherit" component={Link} to="/salud">Salud</Button>
          <Button color="inherit" component={Link} to="/ventas">Ventas</Button>
          <Button color="inherit" component={Link} to="/gastos">Gastos</Button>
          {isAuth ? (
            <Button color="inherit" onClick={handleLogout}>Salir</Button>
          ) : (
            <Button color="inherit" component={Link} to="/login">Login</Button>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        <Outlet />
      </Box>
    </>
  );
};

export default MainLayout;
