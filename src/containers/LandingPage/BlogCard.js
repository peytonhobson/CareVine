import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import { NamedLink } from '../../components';

import css from './LandingPage.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: '100%',
    borderRadius: 'var(--borderRadius)',
    transition: 'all 0.2s ease-in 0s',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  media: {
    height: '12rem',
  },
  cardActions: {
    display: 'flex',
    margin: '0 10px',
    justifyContent: 'space-between',
  },
  content: {
    height: '8rem',
    display: 'flex',
    alignItems: 'center',
  },
  author: {
    display: 'flex',
  },
}));

const BlogCard = props => {
  const { hero, title, slug } = props;

  const classes = useStyles();

  return (
    <NamedLink name="BlogPostPage" params={{ slug: slug }} className={css.link}>
      <Card className={classes.card}>
        <CardActionArea>
          <CardMedia className={classes.media} image={hero} title="Contemplative Reptile" />
          <CardContent className={classes.content}>
            <h3 className={css.blogTitle}>{title}</h3>
          </CardContent>
        </CardActionArea>
      </Card>
    </NamedLink>
  );
};

export default BlogCard;
