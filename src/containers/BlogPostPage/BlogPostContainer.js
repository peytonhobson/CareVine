import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Container, Avatar } from '@material-ui/core';
import { useQuery, gql } from '@apollo/client';
import DOMPurify from 'dompurify';
import { NamedRedirect } from '../../components';

import css from './BlogPostPage.module.css';

const STRAPI_URL = process.env.REACT_APP_STRAPI_URL;
const isDev = process.env.NODE_ENV === 'development';

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
  authorName: {
    fontWeight: 600,
  },
  avatar: {
    width: '3.5rem',
    height: '3.5rem',
  },
  bottomAvatar: {
    width: '5rem',
    height: '5rem',
    marginRight: theme.spacing(4),
  },
  authorText: {
    paddingRight: theme.spacing(2),
    fontFamily: '"Trebuchet MS", Helvetica, sans-serif',
  },
  authorContainer: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: theme.spacing(10),
  },
  authorDisplay: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
  },
  authorBio: {
    textAlign: 'justify',
    maxWidth: '50%',
    fontFamily: '"Trebuchet MS", Helvetica, sans-serif',
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
    paddingTop: theme.spacing(5),
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
                bio
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
          body
          status
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
          authorBio: data.blogs.data[0].attributes.author.data.attributes.bio,
          status: data.blogs.data[0].attributes.status,
        }
      : {};

  if (formattedData.status === 'TEST' && !isDev) {
    return <NamedRedirect name="BlogHomePage" />;
  }

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
        <Typography
          variant="body1"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formattedData.body) }}
        ></Typography>
      </Box>
      <Box className={classes.authorContainer}>
        <Box className={classes.authorDisplay}>
          <Avatar src={formattedData.authorProfilePicture} className={classes.bottomAvatar} />
          <Typography variant="h4" component="h4" className={classes.authorName}>
            {formattedData.authorName}
          </Typography>
        </Box>
        <Typography variant="subtitle1" component="p" className={classes.authorBio}>
          {formattedData.authorBio}
        </Typography>
      </Box>
    </Container>
  );
};

export default BlogPostContainer;
