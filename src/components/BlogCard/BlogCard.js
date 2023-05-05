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
import { NamedLink } from '..';
import { truncateString } from '../../util/data';

import css from './BlogCard.module.css';

const useStyles = makeStyles(theme => ({
  card: {
    maxWidth: '100%',
    height: '30rem',
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
  const { hero, title, description, authorName, authorProfilePicture, date, slug } = props;

  const classes = useStyles();

  return (
    <NamedLink name="BlogPostPage" params={{ slug: slug }}>
      <Card className={classes.card}>
        <CardActionArea>
          <CardMedia className={classes.media} image={hero} title="Contemplative Reptile" />
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2" className={classes.cardTitle}>
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              component="p"
              className={classes.cardDescription}
            >
              {truncateString(description, 150)}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions className={classes.cardActions}>
          <Box className={classes.author}>
            <Avatar src={authorProfilePicture} />
            <Box ml={2}>
              <Typography variant="subtitle2" component="p">
                {authorName}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary" component="p">
                {date}
              </Typography>
            </Box>
          </Box>
          <Box>
            <BookmarkBorderIcon />
          </Box>
        </CardActions>
      </Card>
    </NamedLink>
  );
};

export default BlogCard;
