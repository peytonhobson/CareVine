import React, { useState } from 'react';
import { isScrollingDisabled } from '../../ducks/UI.duck';
import { compose } from 'redux';
import { connect } from 'react-redux';
import BlogPostContainer from './BlogPostContainer';
import { useQuery } from 'graphql-hooks';

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

const BlogPostPageComponent = props => {
  const { scrollingDisabled, params } = props;

  const { loading, error, data } = useQuery(BLOG, {
    variables: { slug: params.slug },
  });

  const seo = data?.blogs?.data?.length > 0 ? data.blogs.data[0].attributes.seo : {};

  return data && seo ? (
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
        image: [seo.shareImage?.data?.attributes.url],
        facebookImages: [seo.shareImage?.data?.attributes.url],
        twitterImages: [seo.shareImage?.data?.attributes.url],
      }}
    >
      <LayoutSingleColumn>
        <LayoutWrapperTopbar>
          <TopbarContainer currentPage="BlogPostPage" />
        </LayoutWrapperTopbar>
        <LayoutWrapperMain className={css.mainWrapper}>
          <BlogPostContainer
            slug={params.slug}
            data={data}
            loading={loading}
            error={error}
            seo={seo}
          />
        </LayoutWrapperMain>
        <LayoutWrapperFooter>
          <Footer />
        </LayoutWrapperFooter>
      </LayoutSingleColumn>
    </Page>
  ) : null;
};

const mapStateToProps = state => {
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const BlogPostPage = compose(connect(mapStateToProps))(BlogPostPageComponent);

export default BlogPostPage;
