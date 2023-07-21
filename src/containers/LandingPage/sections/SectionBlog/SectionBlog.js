import React, { useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { useQuery } from 'graphql-hooks';
import { useCheckMobileScreen } from '../../../../util/hooks';
import BlogCard from './BlogCard';

import css from './SectionBlog.module.css';

const isDev = process.env.REACT_APP_ENV === 'development';

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

const SectionBlog = props => {
  const classes = useStyles();

  const containerRef = useRef(null);
  const isMobile = useCheckMobileScreen();

  const { data } = useQuery(BLOG, {
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
      {data ? (
        isMobile ? (
          <section className={css.blogSection}>
            <h2 className={css.contentTitle}>Recent Blog Posts</h2>
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
          </section>
        ) : (
          <section className={css.blogSection}>
            <h2 className={css.contentTitle}>Recent Blog Posts</h2>
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
          </section>
        )
      ) : null}
    </Container>
  );
};

export default SectionBlog;
