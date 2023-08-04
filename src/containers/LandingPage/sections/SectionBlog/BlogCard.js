import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import { NamedLink } from '../../../../components';

import css from './SectionBlog.module.css';

const BlogCard = props => {
  const { hero, title, slug, description } = props;

  const useStyles = makeStyles(theme => ({
    card: {
      width: '100%',
      height: '100%',
      borderRadius: 'var(--borderRadius)',
      transition: 'all 0.2s ease-in 0s !important',
      '&:hover': {
        transform: 'scale(1.02)',
      },
    },
    media: {
      height: '100%',
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${hero}) !important`,
    },
    actionArea: {
      height: '100%',
    },
    content: {
      height: '100%',
      display: 'flex',
      justifyContent: 'flex-end',
      flexDirection: 'column',
      color: 'var(--matterColorLight)',
    },
    author: {
      display: 'flex',
    },
  }));
  const classes = useStyles();

  return (
    <NamedLink name="BlogPostPage" params={{ slug: slug }} className={css.link}>
      <Card className={classes.card}>
        <CardActionArea className={classes.actionArea}>
          <CardMedia className={classes.media} image={hero} title="Blog post image" loading="lazy">
            <CardContent className={classes.content}>
              <h2 className={css.blogTitle}>{title}</h2>
              {description && <p className={css.blogDescription}>{description}</p>}
            </CardContent>
          </CardMedia>
        </CardActionArea>
      </Card>
    </NamedLink>
  );
};

export default BlogCard;
