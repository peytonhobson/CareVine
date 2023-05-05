import React, { useState } from 'react';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { GraphQLClient, ClientContext } from 'graphql-hooks';
import BlogPostContainer from './BlogPostContainer';

import {
  Page,
  LayoutSingleColumn,
  LayoutWrapperTopbar,
  LayoutWrapperMain,
  LayoutWrapperFooter,
  Footer,
} from '../../components';
import { TopbarContainer } from '..';

import css from './BlogPostPage.module.css';

const STRAPI_API_URL = `${process.env.REACT_APP_STRAPI_URL}/graphql`;

const client = new GraphQLClient({
  url: STRAPI_API_URL,
});

const BlogPostPageComponent = props => {
  const { scrollingDisabled, params } = props;
  const [seo, setSeo] = useState({});

  const handleSEOChange = val => {
    setSeo(val);
  };

  return (
    <Page
      className={css.root}
      scrollingDisabled={scrollingDisabled}
      contentType="website"
      description={seo.metaDescription}
      title={seo.metaTitle}
      schema={{
        '@context': 'http://schema.org',
        '@type': 'WebPage',
        description: seo.metaDescription,
        name: seo.metaTitle,
        image: [seo.shareImage],
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="BlogPostPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <ClientContext.Provider value={client}>
            <BlogPostContainer slug={params.slug} onSEOChange={handleSEOChange} />
          </ClientContext.Provider>
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const BlogPostPage = compose(connect(mapStateToProps))(BlogPostPageComponent);

export default BlogPostPage;
