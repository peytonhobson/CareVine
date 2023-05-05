import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Container, Avatar } from '@material-ui/core';
import { useQuery, gql } from '@apollo/client';
import { richText } from '../../util/richText';
import ReactMarkdown from 'react-markdown';

import css from './BlogPostPage.module.css';

const STRAPI_URL = process.env.REACT_APP_STRAPI_URL;

const useStyles = makeStyles(theme => ({
  appBar: {
    backgroundColor: '#fff',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(7),
  },
  avatar: {
    width: '3.5rem',
    height: '3.5rem',
  },
  authorText: {
    paddingRight: theme.spacing(2),
  },
  blogsContainer: {
    paddingBlock: theme.spacing(10),
    maxWidth: '70vw',
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  blogTitle: {
    fontWeight: 600,
    textAlign: 'center',
    // paddingBottom: theme.spacing(8),
  },
  blogBody: {
    width: '80%',
    margin: 'auto',
  },
  hero: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '70vw',

    [theme.breakpoints.down('sm')]: {
      height: 300,
      fontSize: '3em',
    },
  },
  image: {
    maxWidth: '100%',
  },
}));

const BLOG = gql`
  query getBlog($slug: String) {
    blogs(filters: { slug: { eq: $slug } }) {
      data {
        attributes {
          slug
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
  const classes = useStyles();

  // TODO: handle loading and error
  const { loading, error, data } = useQuery(BLOG, { slug: props.slug });

  const formattedData =
    data?.blogs?.data?.length > 0
      ? {
          title: data.blogs.data[0].attributes.title,
          date: data.blogs.data[0].attributes.date,
          hero: `${STRAPI_URL}${data.blogs.data[0].attributes.hero.data.attributes.url}`,
          body: data.blogs.data[0].attributes.body,
          authorProfilePicture: `${STRAPI_URL}${data.blogs.data[0].attributes.author.data.attributes.profilePicture.data.attributes.url}`,
          authorName: data.blogs.data[0].attributes.author.data.attributes.name,
        }
      : {};

  return (
    <Container maxWidth="lg" className={classes.blogsContainer}>
      <Typography variant="h2" className={classes.blogTitle}>
        {formattedData.title}
      </Typography>
      <Box className={classes.author}>
        <Typography variant="subtitle1" component="p" className={classes.authorText}>
          {formattedData.date} | By {formattedData.authorName}
        </Typography>
        <Avatar src={formattedData.authorProfilePicture} className={classes.avatar} />
      </Box>
      <Box className={classes.hero}>
        <img className={classes.image} src={formattedData.hero} alt="blog" />
      </Box>
      <Box className={classes.blogBody}>
        {formattedData.body?.map((section, index) => (
          <Box key={index} className={css.section}>
            <Typography variant="body1">
              <ReactMarkdown>{section.section}</ReactMarkdown>
            </Typography>
          </Box>
        ))}
      </Box>
    </Container>
  );
};

export default BlogPostContainer;
