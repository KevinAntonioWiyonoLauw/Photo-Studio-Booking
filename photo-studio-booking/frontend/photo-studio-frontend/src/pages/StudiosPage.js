// src/pages/StudiosPage.js
import { useState, useEffect } from 'react';
import { getAllStudios } from '../services/studioService';
import { Card, CardMedia, CardContent, Typography, Grid, Container } from '@mui/material';
import { Link } from 'react-router-dom';

const StudiosPage = () => {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        const data = await getAllStudios();
        setStudios(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load studios');
        setLoading(false);
      }
    };

    fetchStudios();
  }, []);

  if (loading) return <p>Loading studios...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Our Studios
      </Typography>
      <Grid container spacing={4}>
        {studios.map((studio) => (
          <Grid item xs={12} sm={6} md={4} key={studio.id}>
            <Card component={Link} to={`/studios/${studio.id}`} sx={{ textDecoration: 'none' }}>
              <CardMedia
                component="img"
                height="200"
                image={studio.image_url || 'https://via.placeholder.com/300x200'}
                alt={studio.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {studio.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {studio.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default StudiosPage;