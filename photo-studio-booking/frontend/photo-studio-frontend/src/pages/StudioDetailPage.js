// src/pages/StudioDetailPage.js
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { getStudioById } from '../services/studioService';
import { getPackagesByStudio } from '../services/packageService';
import { AuthContext } from '../context/AuthContext';
import {
  Container, Typography, Box, Grid, Card, CardMedia, CardContent, 
  CardActions, Button, List, ListItem, ListItemIcon, ListItemText, Divider,
  Paper, Chip, Alert
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';

const StudioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [studio, setStudio] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudioData = async () => {
      try {
        const studioData = await getStudioById(id);
        setStudio(studioData);
        
        const packagesData = await getPackagesByStudio(id);
        setPackages(packagesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching studio data:', err);
        setError('Could not load studio information');
        setLoading(false);
      }
    };

    fetchStudioData();
  }, [id]);

  if (loading) return (
    <Container>
      <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading studio details...</Typography>
      </Box>
    </Container>
  );

  if (error) return (
    <Container>
      <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      <Button component={RouterLink} to="/studios" variant="contained">
        Return to Studios
      </Button>
    </Container>
  );

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        {/* Studio Details */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <CardMedia
              component="img"
              height="400"
              image={studio.image_url || 'https://via.placeholder.com/600x400'}
              alt={studio.name}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                {studio.name}
              </Typography>
              <Typography variant="body1" paragraph>
                {studio.description}
              </Typography>
              <Button
                variant="contained"
                component={RouterLink}
                to="/studios"
                sx={{ mr: 2, mb: 2 }}
              >
                Back to Studios
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Packages Section */}
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Available Packages
          </Typography>
          <Divider sx={{ mb: 4 }} />

          {packages.length === 0 ? (
            <Alert severity="info">No packages available for this studio at the moment.</Alert>
          ) : (
            <Grid container spacing={4}>
              {packages.map((pkg) => (
                <Grid item xs={12} md={4} key={pkg.id}>
                  <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" component="h3" gutterBottom>
                        {pkg.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <MonetizationOnIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" color="primary">
                          ${pkg.price}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {pkg.duration} minutes
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" paragraph>
                        {pkg.description}
                      </Typography>
                      
                      {pkg.features && pkg.features.length > 0 && (
                        <List dense>
                          {pkg.features.map((feature, index) => (
                            <ListItem key={index} disableGutters>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircleOutlineIcon color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={feature} />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        fullWidth 
                        variant="contained"
                        onClick={() => {
                          if (!user) {
                            navigate('/login', { 
                              state: { message: 'Please log in to book a session' } 
                            });
                          } else {
                            navigate(`/booking/${studio.id}`, { 
                              state: { selectedPackageId: pkg.id } 
                            });
                          }
                        }}
                      >
                        Book This Package
                      </Button>
                    </CardActions>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default StudioDetailPage;