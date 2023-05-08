import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import CardGrid from './CardGrid';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ClientContext } from 'graphql-hooks';

import { Page, LayoutSingleColumn, LayoutWrapperTopbar, LayoutWrapperMain } from '../../components';
import { TopbarContainer } from '..';

import css from './BlogHomePage.module.css';

const useStyles = makeStyles(theme => ({
  hero: {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1558981852-426c6c22a060?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80')`,
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

  const client = useContext(ClientContext);

  // TODO: Update these for SEO
  const schemaTitle = 'Blog';
  const schemaDescription = 'Blog';

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
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="BlogHomePage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <Box className={classes.hero}>
            <Box>Blog</Box>
          </Box>
          <CardGrid />
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
