import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import { BlogCard } from '../../components';
import { useQuery, gql } from '@apollo/client';

import css from './BlogHomePage.module.css';

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
  query {
    blogs {
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
        }
      }
    }
  }
`;

const CardGrid = props => {
  const classes = useStyles();

  // DO something with loading and error
  const { loading, error, data } = useQuery(BLOG, {});

  if (data) {
    console.log(data);
  }

  return (
    <Container maxWidth="lg" className={classes.blogsContainer}>
      <h1>Articles</h1>
      <Grid container spacing={3}>
        {data?.blogs.data.map(blog => {
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
        <Pagination count={10} />
      </Box>
    </Container>
  );
};

export default CardGrid;
