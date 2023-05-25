import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import CardGrid from './CardGrid';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useIsSsr } from '../../util/hooks';

import { Page, LayoutSingleColumn, LayoutWrapperTopbar, LayoutWrapperMain } from '../../components';
import { TopbarContainer } from '..';

import blogBackground from '../../assets/blog-background.jpg';

import css from './BlogHomePage.module.css';

const useStyles = makeStyles(theme => ({
  hero: {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('${blogBackground}')`,
    height: '31rem',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontSize: '4rem',
    [theme.breakpoints.down('sm')]: {
      height: 300,
      fontSize: '3em',
    },
  },
}));

const BlogHomePageComponent = props => {
  const { scrollingDisabled } = props;
  const classes = useStyles();

  const isSsr = useIsSsr();

  const schemaTitle = 'CareVine Blog | Insights and Resources for Caregivers and Care Seekers';
  const schemaDescription =
    "Stay informed on caregiving trends & news. CareVine's blog offers tips & resources for caregivers & care seekers. Join our community today!";

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      description={schemaDescription}
      title={schemaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        description: schemaDescription,
        name: schemaTitle,
        image: ['/static/images/Blog_Background.png'],
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="BlogHomePage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          {!isSsr && (
            <>
              <Box className={classes.hero}>
                <Box>
                  <h1 className={css.header}>Blog</h1>
                </Box>
              </Box>
              <CardGrid />
            </>
          )}
        </LayoutWrapperMain>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const BlogHomePage = compose(connect(mapStateToProps))(BlogHomePageComponent);

export default BlogHomePage;
