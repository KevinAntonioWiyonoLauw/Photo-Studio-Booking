// src/pages/HomePage.js
import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { getAllStudios } from '../services/studioService';
import {
  Container, Box, Typography, Button, Grid,
  Card, CardMedia, CardContent, CardActions
} from '@mui/material';

const HomePage = () => {
  const [featuredStudios, setFeaturedStudios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedStudios = async () => {
      try {
        const studios = await getAllStudios();
        // Take the first 3 studios as featured
        setFeaturedStudios(studios.slice(0, 3));
        setLoading(false);
      } catch (err) {
        console.error('Error loading studios:', err);
        setLoading(false);
      }
    };

    fetchFeaturedStudios();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Professional Photo Studios
          </Typography>
          <Typography variant="h5" paragraph sx={{ mb: 4 }}>
            Book your perfect photography session with our top-rated studios
          </Typography>
          <Button 
            component={RouterLink}
            to="/studios"
            variant="contained" 
            color="secondary"
            size="large"
          >
            Browse Studios
          </Button>
        </Container>
      </Box>

      {/* Featured Studios Section */}
      <Container>
        <Typography variant="h4" component="h2" gutterBottom>
          Featured Studios
        </Typography>
        
        <Grid container spacing={4}>
          {loading ? (
            <Typography>Loading featured studios...</Typography>
          ) : (
            featuredStudios.map(studio => (
              <Grid item xs={12} md={4} key={studio.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={studio.image_url || 'https://via.placeholder.com/300x200'}
                    alt={studio.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h3">
                      {studio.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {studio.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      component={RouterLink} 
                      to={`/studios/${studio.id}`}
                      size="small" 
                      color="primary"
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
        
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Button 
            component={RouterLink}
            to="/studios"
            variant="outlined" 
            color="primary"
            size="large"
          >
            View All Studios
          </Button>
        </Box>
      </Container>
      
      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8, mt: 8 }}>
        <Container>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            How It Works
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  1. Choose a Studio
                </Typography>
                <Typography>
                  Browse our selection of professional studios and find the perfect match for your needs.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  2. Select a Package
                </Typography>
                <Typography>
                  Pick from a variety of photography packages tailored to different occasions and requirements.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" component="h3" gutterBottom>
                  3. Book Your Session
                </Typography>
                <Typography>
                  Choose an available time slot, confirm your booking, and get ready for your photoshoot!
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;