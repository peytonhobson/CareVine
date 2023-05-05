import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import { useQuery, gql } from '@apollo/client';

import css from './BlogPostPage.module.css';

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
  hero: {
    height: '500px',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '60vw',
    [theme.breakpoints.down('sm')]: {
      height: 300,
      fontSize: '3em',
    },
  },
}));

const BLOG = gql`
  query getBlog($slug: String!) {
    blog(where: { slug: $slug }) {
      data {
        attributes {
          title
          date
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
          body {
            section
          }
        }
      }
    }
  }
`;

const BlogPostContainer = props => {
  const { hero } = props;
  const classes = useStyles();

  const { loading, error, data } = useQuery(BLOG, { slug: props.slug });

  return (
    <Container maxWidth="lg" className={classes.blogsContainer}>
      <Box className={classes.hero}>
        <img className={classes.image} src={hero} alt="blog" />
      </Box>
    </Container>
  );
};

export default BlogPostContainer;
