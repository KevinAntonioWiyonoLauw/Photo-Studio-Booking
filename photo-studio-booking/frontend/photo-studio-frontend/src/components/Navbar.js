// src/components/Navbar.js
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography variant="h6" component={Link} to="/" sx={{ color: 'white', textDecoration: 'none', mr: 2 }}>
            Photo Studio
          </Typography>
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            <Button component={Link} to="/studios" color="inherit">
              Studios
            </Button>
          </Box>

          <Box>
            {user ? (
              <>
                <Button component={Link} to="/bookings" color="inherit">
                  My Bookings
                </Button>
                {user.role === 'admin' && (
                  <Button component={Link} to="/admin" color="inherit">
                    Admin
                  </Button>
                )}
                <Button color="inherit" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" color="inherit">
                  Login
                </Button>
                <Button component={Link} to="/register" color="inherit">
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;