import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import CardGrid from './CardGrid';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

import { Page, LayoutSingleColumn, LayoutWrapperTopbar, LayoutWrapperMain } from '../../components';
import { TopbarContainer } from '..';

import css from './BlogHomePage.module.css';

const useStyles = makeStyles(theme => ({
  hero: {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1558981852-426c6c22a060?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&w=1000&q=80')`,
    height: '500px',
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

const client = new ApolloClient({
  uri: 'http://localhost:1337/graphql',
  cache: new InMemoryCache(),
});

const BlogHomePageComponent = props => {
  const { scrollingDisabled } = props;
  const classes = useStyles();

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
          <ApolloProvider client={client}>
            <CardGrid />
          </ApolloProvider>
        </LayoutWrapperMain>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    sendFeedbackEmailInProgress,
    sendFeedbackEmailError,
    sendFeedbackEmailSuccess,
  } = state.FeedbackPage;

  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
    sendFeedbackEmailInProgress,
    sendFeedbackEmailError,
    sendFeedbackEmailSuccess,
  };
};

const mapDispatchToProps = dispatch => ({
  onSendFeedbackEmail: feedback => dispatch(feedbackEmail(feedback)),
});

const BlogHomePage = compose(connect(mapStateToProps, mapDispatchToProps))(BlogHomePageComponent);

export default BlogHomePage;
