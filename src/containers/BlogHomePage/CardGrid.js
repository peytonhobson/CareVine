import React, { useState, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import { BlogCard, IconSpinner } from '../../components';
import { useQuery } from 'graphql-hooks';
import { useCheckMobileScreen } from '../../util/hooks';

import css from './BlogHomePage.module.css';

const isDev = process.env.NODE_ENV === 'development';
const PAGE_SIZE = 9;
const STRAPI_URL = process.env.REACT_APP_STRAPI_URL;
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
  query getBlogs($page: Int, $pageSize: Int) {
    blogs(pagination: { page: $page, pageSize: $pageSize }, sort: "date:desc") {
      data {
        attributes {
          slug
          title
          date
          description
          hero {
            data {
              attributes {
                url
              }
            }
          }
          author {
            data {
              attributes {
                name
                avatar {
                  data {
                    attributes {
                      url
                    }
                  }
                }
              }
            }
          }
          status
        }
      }
      meta {
        pagination {
          page
          pageSize
          pageCount
          total
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
    variables: { page, pageSize: PAGE_SIZE },
  });

  const pageCount = data?.blogs.meta.pagination.pageCount;

  return (
    <Container maxWidth="lg" className={classes.blogsContainer} ref={containerRef}>
      <h1>Articles</h1>
      {loading ? (
        <Box className={classes.spinnerContainer}>
          <IconSpinner className={css.spinner} />
        </Box>
      ) : data ? (
        <Grid container spacing={3}>
          {data?.blogs.data
            .filter(d => d.attributes.status !== 'TEST' || isDev)
            .map(blog => {
              const blogCardProps = {
                hero: `${STRAPI_URL}${blog.attributes.hero?.data?.attributes?.url}`,
                title: blog.attributes.title,
                description: blog.attributes.description,
                authorName: blog.attributes.author?.data?.attributes?.name,
                authorProfilePicture: `${STRAPI_URL}${blog.attributes.author?.data?.attributes?.avatar?.data?.attributes?.url}`,
                date: blog.attributes.date,
                slug: blog.attributes.slug,
              };

              return (
                <Grid item xs={12} sm={6} md={4} key={blog.attributes.slug}>
                  <BlogCard {...blogCardProps} />
                </Grid>
              );
            })}
        </Grid>
      ) : error ? (
        <p className={css.error}>Error loading blogs</p>
      ) : null}
      <Box my={4} className={classes.paginationContainer}>
        <Pagination count={pageCount} page={page} onChange={handlePageChange} />
      </Box>
    </Container>
  );
};

export default CardGrid;
