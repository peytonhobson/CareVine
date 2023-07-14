import React, { useState, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import { IconSpinner } from '../../components';
import { useQuery } from 'graphql-hooks';
import { useCheckMobileScreen } from '../../util/hooks';
import BlogCard from './BlogCard';

import css from './LandingPage.module.css';

const isDev = process.env.REACT_APP_ENV === 'development';
const PAGE_SIZE = 9;

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
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

//Create the query
const BLOG = `
  query getBlogs($limit: Int) {
    blogs(pagination: { limit: $limit }, sort: "date:desc"${
      !isDev ? `, filters: { status: { eq: "PROD" } }` : ''
    }) {
      data {
        attributes {
          title
          hero {
            data {
              attributes {
                url
              }
            }
          }
          status
        }
      }
    }
  }
`;

const CardGrid = props => {
  const classes = useStyles();
  const [page, setPage] = useState(1);

  const containerRef = useRef(null);
  const isMobile = useCheckMobileScreen();

  const handlePageChange = (event, value) => {
    setPage(value);
    if (containerRef.current) {
      const elementHeight = containerRef.current.offsetTop - (isMobile ? 100 : 130);
      setTimeout(() => {
        window.scrollTo({ top: elementHeight, behavior: 'smooth' });
      }, 10);
    }
  };

  const { loading, error, data } = useQuery(BLOG, {
    variables: {
      limit: 3,
    },
  });

  console.log(error);
  console.log(data);

  const pageCount = data?.blogs?.meta?.pagination.pageCount;

  return (
    <Container maxWidth="lg" className={classes.blogsContainer} ref={containerRef}>
      {loading ? (
        <Box className={classes.spinnerContainer}>
          <IconSpinner className={css.spinner} />
        </Box>
      ) : data ? (
        <Grid container spacing={3}>
          {data?.blogs?.data.map(blog => {
            const blogCardProps = {
              hero: blog.attributes.hero?.data?.attributes?.url,
              title: blog.attributes.title,
            };

            return (
              <Grid item xs={12} sm={6} md={4} key={1}>
                <BlogCard {...blogCardProps} />
              </Grid>
            );
          })}
        </Grid>
      ) : error ? (
        <p className={css.error}>Error loading blogs</p>
      ) : null}
    </Container>
  );
};

export default CardGrid;
