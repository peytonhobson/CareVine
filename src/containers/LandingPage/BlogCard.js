import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import Avatar from '@material-ui/core/Avatar';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorder';
import { NamedLink } from '../../components';
import { truncateString } from '../../util/data';

import css from './LandingPage.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: '100%',
    borderRadius: 'var(--borderRadius)',
  },
  media: {
    height: '12rem',
  },
  cardActions: {
    display: 'flex',
    margin: '0 10px',
    justifyContent: 'space-between',
  },
  cardDescription: {
    height: '4.5rem',
    marginTop: '1rem',
  },
  cardTitle: {
    height: '6rem',
  },
  author: {
    display: 'flex',
  },
}));

const BlogCard = props => {
  const { hero, title } = props;

  const classes = useStyles();

  return (
    <Card className={classes.card}>
      <CardActionArea>
        <CardMedia className={classes.media} image={hero} title="Contemplative Reptile" />
        <CardContent>
          <Typography gutterBottom variant="h6" component="h2" className={classes.cardTitle}>
            {title}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default BlogCard;
