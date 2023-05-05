import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import { BlogCard } from '../../components';
import { useQuery, gql } from '@apollo/client';

import css from './BlogHomePage.module.css';

const useStyles = makeStyles(theme => ({
  appBar: {
    backgroundColor: '#fff',
  },
  blogsContainer: {
    paddingTop: theme.spacing(3),
  },
  blogTitle: {
    fontWeight: 800,
    paddingBottom: theme.spacing(3),
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
}));

//Create the query
const BLOG = gql`
  query {
    blogs {
      data {
        attributes {
          Title
        }
      }
    }
  }
`;

const CardGrid = props => {
  const classes = useStyles();

  const { loading, error, data } = useQuery(BLOG, {});

  if (data) {
    console.log(data);
  }

  if (error) {
    console.log(error);
  }

  return (
    <Container maxWidth="lg" className={classes.blogsContainer}>
      <h1>Articles</h1>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <BlogCard />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <BlogCard />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <BlogCard />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <BlogCard />
        </Grid>
      </Grid>
      <Box my={4} className={classes.paginationContainer}>
        <Pagination count={10} />
      </Box>
    </Container>
  );
};

export default CardGrid;
