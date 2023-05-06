import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Container, Avatar } from '@material-ui/core';
import { useQuery } from 'graphql-hooks';
import DOMPurify from 'dompurify';
import { NamedRedirect, NamedLink, IconArrowHead, IconSpinner } from '../../components';

import css from './BlogPostPage.module.css';

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
    width: '85%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: theme.spacing(7),
    borderTop: '1px solid #eaeaea',
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
    maxWidth: '58%',
    fontFamily: '"Trebuchet MS", Helvetica, sans-serif',
  },
  backContainer: {
    width: '100%',
    paddingBottom: theme.spacing(2),
  },
  blogsContainer: {
    paddingTop: theme.spacing(7),
    paddingBottom: theme.spacing(10),
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
    paddingBlock: theme.spacing(5),
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
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
  },
}));

const BLOG = `
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
          body
          status
          seo {
            metaTitle
            metaDescription
            shareImage {
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
`;

const BlogPostContainer = props => {
  const { onSEOChange, slug } = props;
  const classes = useStyles();

  const { loading, error, data } = useQuery(BLOG, {
    variables: { slug },
  });

  const seo = data?.blogs?.data?.length > 0 ? data.blogs.data[0].attributes.seo : {};

  useEffect(() => {
    onSEOChange(seo);
  }, [seo.metaTitle]);

  const formattedData =
    data?.blogs?.data?.length > 0
      ? {
          title: data.blogs.data[0].attributes.title,
          date: data.blogs.data[0].attributes.date,
          hero: data.blogs.data[0].attributes.hero.data.attributes.url,
          body: data.blogs.data[0].attributes.body,
          authorProfilePicture:
            data.blogs.data[0].attributes.author.data.attributes.avatar.data.attributes.url,
          authorName: data.blogs.data[0].attributes.author.data.attributes.name,
          authorBio: data.blogs.data[0].attributes.author.data.attributes.bio,
          status: data.blogs.data[0].attributes.status,
        }
      : {};

  console.log(formattedData.authorProfilePicture);

  if (formattedData.status === 'TEST' && !isDev) {
    return <NamedRedirect name="BlogHomePage" />;
  }

  return (
    <Container maxWidth="lg" className={classes.blogsContainer}>
      <Box className={classes.backContainer}>
        <NamedLink name="BlogHomePage" className={css.goBackButton} type="button">
          <IconArrowHead rootClassName={css.arrowIcon} direction="left" size="small" />
          <span className={css.goBackText}>Back to Blog List</span>
        </NamedLink>
      </Box>
      {loading ? (
        <Box className={classes.spinnerContainer}>
          <IconSpinner className={css.spinner} />
        </Box>
      ) : data ? (
        <>
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
        </>
      ) : error ? (
        <p className={css.error}>Failed to load blog. Please try refreshing the page.</p>
      ) : null}
    </Container>
  );
};

export default BlogPostContainer;
