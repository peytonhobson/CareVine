import React, { useState, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Pagination from '@material-ui/lab/Pagination';
import { IconSpinner } from '../../components';
import { useQuery } from 'graphql-hooks';
import { useCheckMobileScreen } from '../../util/hooks';
import BlogCard from './BlogCard';

import css from './LandingPage.module.css';

const isDev = process.env.REACT_APP_ENV === 'development';
const PAGE_SIZE = 9;

const useStyles = makeStyles(theme => ({
  blogsContainer: {
    padding: 0,
  },
  appBar: {
    backgroundColor: '#fff',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

//Create the query
const BLOG = `
  query getBlogs($limit: Int) {
    blogs(pagination: { limit: $limit }, sort: "date:desc"${
      !isDev ? `, filters: { status: { eq: "PROD" } }` : ''
    }) {
      data {
        attributes {
          slug
          title
          hero {
            data {
              attributes {
                url
              }
            }
          }
          description
          status
        }
      }
    }
  }
`;

const CardGrid = props => {
  const classes = useStyles();

  const containerRef = useRef(null);
  const isMobile = useCheckMobileScreen();

  const { loading, error, data } = useQuery(BLOG, {
    variables: {
      limit: isMobile ? 5 : 3,
    },
  });

  const blogCardProps = data?.blogs?.data.map((blog, index) => {
    return {
      hero: blog.attributes.hero?.data?.attributes?.url,
      title: blog.attributes.title,
      slug: blog.attributes.slug,
      description: index === 0 ? blog.attributes.description : null,
    };
  });

  return (
    <Container maxWidth="lg" className={classes.blogsContainer} ref={containerRef}>
      {loading ? (
        <Box className={classes.spinnerContainer}>
          <IconSpinner className={css.spinner} />
        </Box>
      ) : data ? (
        isMobile ? (
          <div className={css.blogCardContainer}>
            {data?.blogs?.data.map(blog => {
              const blogCardProps = {
                hero: blog.attributes.hero?.data?.attributes?.url,
                title: blog.attributes.title,
                slug: blog.attributes.slug,
              };

              return <BlogCard {...blogCardProps} />;
            })}
          </div>
        ) : (
          <div className={css.blogCardContainerGrid}>
            <div className={css.left}>
              <BlogCard {...blogCardProps[0]} />
            </div>
            <div className={css.rightTop}>
              <BlogCard {...blogCardProps[1]} />
            </div>
            <div className={css.rightBottom}>
              <BlogCard {...blogCardProps[2]} />
            </div>
          </div>
        )
      ) : error ? (
        <p className={css.error}>Error loading blogs</p>
      ) : null}
    </Container>
  );
};

export default CardGrid;
