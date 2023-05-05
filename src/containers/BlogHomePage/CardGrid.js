import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import { BlogCard } from '../../components';
import { useQuery, gql } from '@apollo/client';
const isDev = process.env.NODE_ENV === 'development';

import css from './BlogHomePage.module.css';

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
}));

//Create the query
const BLOG = gql`
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
                profilePicture {
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

  // DO something with loading and error
  const { loading, error, data } = useQuery(BLOG, { variables: { page, pageSize: PAGE_SIZE } });

  const pageCount = data?.blogs.meta.pagination.pageCount;

  if (data) {
    console.log(data);
  }

  return (
    <Container maxWidth="lg" className={classes.blogsContainer}>
      <h1>Articles</h1>
      <Grid container spacing={3}>
        {data?.blogs.data
          .filter(d => d.attributes.status !== 'TEST' || isDev)
          .map(blog => {
            const blogCardProps = {
              hero: `${STRAPI_URL}${blog.attributes.hero?.data?.attributes?.url}`,
              title: blog.attributes.title,
              description: blog.attributes.description,
              authorName: blog.attributes.author?.data?.attributes?.name,
              authorProfilePicture: `${STRAPI_URL}${blog.attributes.author?.data?.attributes?.profilePicture?.data?.attributes?.url}`,
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
      <Box my={4} className={classes.paginationContainer}>
        <Pagination
          count={pageCount}
          page={page}
          onChange={(e, pageNumber) => setPage(pageNumber)}
        />
      </Box>
    </Container>
  );
};

export default CardGrid;
