import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box, Container, Avatar } from '@material-ui/core';
import DOMPurify from 'dompurify';
import {
  NamedRedirect,
  NamedLink,
  IconArrowHead,
  IconSpinner,
  IconSocialMediaFacebook,
  IconSocialMediaPinterest,
  IconSocialMediaTwitter,
  IconEmail,
} from '../../components';
import { useCheckMobileScreen, useIsSsr } from '../../util/hooks';

import css from './BlogPostPage.module.css';

const isDev = process.env.REACT_APP_ENV === 'development';

const useStyles = makeStyles(theme => ({
  appBar: {
    backgroundColor: '#fff',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
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
    paddingTop: theme.spacing(7),
    borderTop: '1px solid var(--matterColorNegative)',
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
    maxWidth: '30rem',
    fontFamily: '"Trebuchet MS", Helvetica, sans-serif',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
    },
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
    [theme.breakpoints.down('sm')]: {
      maxWidth: '90vw',
    },
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
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      maxWidth: '100%',
    },
  },
  hero: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '70vw',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      maxWidth: '100%',
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
  shareButtonContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    paddingBottom: theme.spacing(5),
  },
  socialMediaIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '50%',
    backgroundColor: 'var(--matterColor)',
    marginInline: '0.75rem',
    '&:hover': {
      cursor: 'pointer',
    },
  },
}));

const BlogPostContainer = props => {
  const { data, loading, error, seo } = props;
  const classes = useStyles();

  const isMobile = useCheckMobileScreen();

  const isSsr = useIsSsr();
  if (isSsr) return null;

  const formattedData =
    data?.blogs?.data?.length > 0
      ? {
          title: data.blogs.data[0].attributes.title,
          date: data.blogs.data[0].attributes.date,
          hero: data.blogs.data[0].attributes.hero?.data.attributes.url,
          body: data.blogs.data[0].attributes.body,
          authorProfilePicture:
            data.blogs.data[0].attributes.author?.data.attributes.avatar.data.attributes.url,
          authorName: data.blogs.data[0].attributes.author?.data.attributes.name,
          authorBio: data.blogs.data[0].attributes.author?.data.attributes.bio,
          status: data.blogs.data[0].attributes.status,
        }
      : {};

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`;
    window.open(url, '_blank');
  };

  const handleSharePinterest = () => {
    const url = `https://pinterest.com/pin/create/button/?url=${window.location.href}&media=${
      seo.shareImage.data ? seo.shareImage.data.attributes.url : formattedData.hero
    }&description=${seo.metaDescription}`;
    window.open(url, '_blank');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${window.location.href}&text=${seo.metaTitle}`;
    window.open(url.replace('| CareVine', ''), 'twitter-share', 'width=626,height=436', '_blank');
  };

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
          <Typography variant={isMobile ? 'h4' : 'h2'} className={classes.blogTitle}>
            {formattedData.title}
          </Typography>
          <Box className={classes.author}>
            <Typography variant="subtitle1" component="p" className={classes.authorText}>
              {formattedData.date} | By {formattedData.authorName}
            </Typography>
            <Avatar src={formattedData.authorProfilePicture} className={classes.avatar} />
          </Box>
          <Box className={classes.shareButtonContainer}>
            <Box className={classes.socialMediaIconContainer} onClick={handleShareFacebook}>
              <IconSocialMediaFacebook
                className={css.socialMediaIcon}
                height="1.5rem"
                width="1.5rem"
              />
            </Box>
            <Box className={classes.socialMediaIconContainer} onClick={handleSharePinterest}>
              <IconSocialMediaPinterest
                className={css.socialMediaIcon}
                height="1.5rem"
                width="1.5rem"
              />
            </Box>
            <Box className={classes.socialMediaIconContainer} onClick={handleShareTwitter}>
              <IconSocialMediaTwitter
                className={css.socialMediaIcon}
                height="1.5rem"
                width="1.5rem"
              />
            </Box>
            <Box className={classes.socialMediaIconContainer}>
              <a href={`mailto:?subject=${seo.metaTitle}&body=${window.location.href}`}>
                <IconEmail className={css.socialMediaIcon} height="1.5rem" width="1.5rem" />
              </a>
            </Box>
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
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h4"
                className={classes.authorName}
              >
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
