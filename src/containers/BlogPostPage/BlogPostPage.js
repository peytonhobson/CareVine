import React from 'react';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import BlogPostContainer from './BlogPostContainer';

import { Page, LayoutSingleColumn, LayoutWrapperTopbar, LayoutWrapperMain } from '../../components';
import { TopbarContainer } from '..';

import css from './BlogPostPage.module.css';

const STRAPI_API_URL = `${process.env.REACT_APP_STRAPI_URL}/graphql`;

const client = new ApolloClient({
  uri: STRAPI_API_URL,
  cache: new InMemoryCache(),
});

const BlogHomePageComponent = props => {
  const { scrollingDisabled, params } = props;

  // TODO: Update these for SEO
  const schemaTitle = 'Blog Post';
  const schemaDescription = 'Blog Post';

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
          <TopbarContainer currentPage="BlogPostPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <ApolloProvider client={client}>
            <BlogPostContainer slug={params.slug} />
          </ApolloProvider>
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

const BlogPostPage = compose(connect(mapStateToProps))(BlogHomePageComponent);

export default BlogPostPage;
