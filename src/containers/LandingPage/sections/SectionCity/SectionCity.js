import React from 'react';

import { Card, CardContent, CardMedia, CardActionArea } from '@mui/material';
import { makeStyles } from '@material-ui/core/styles';
import tempImg from '../../../../assets/Magnify-BG.png';
import { NamedLink } from '../../../../components';

import css from './SectionCity.module.css';

const useStyles = makeStyles(theme => ({
  cityCard: {
    transition: 'all 0.2s ease-in 0s !important',
    '&:hover': {
      transform: 'scale(1.05)',
    },
    borderRadius: 'var(--borderRadius) !important',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      marginBottom: '2rem',
    },
    [theme.breakpoints.only('md')]: {
      width: '15rem',
    },
    [theme.breakpoints.up('lg')]: {
      width: '20rem',
    },
  },
  cityImage: {
    maxHeight: '12rem',
    [theme.breakpoints.down('sm')]: {
      maxHeight: '15rem',
    },
  },
}));

const SectionCity = () => {
  const classes = useStyles();

  return (
    <section className={css.citySection}>
      <div className={css.citySectionContent}>
        <h1 className={css.contentTitle} style={{ color: 'var(--matterColor)' }}>
          Available across the Country
        </h1>
        <div className={css.cityCardContainer}>
          <NamedLink name="SearchPage" className={css.cityCard}>
            <Card className={classes.cityCard}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  image={tempImg}
                  alt="Portland"
                  className={classes.cityImage}
                />
                <CardContent>
                  <h2 className={css.cityName}>Portland</h2>
                </CardContent>
              </CardActionArea>
            </Card>
          </NamedLink>
          <NamedLink name="SearchPage" className={css.cityCard}>
            <Card className={classes.cityCard}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  image={tempImg}
                  alt="Miami"
                  className={classes.cityImage}
                />
                <CardContent>
                  <h2 className={css.cityName}>Miami</h2>
                </CardContent>
              </CardActionArea>
            </Card>
          </NamedLink>
          <NamedLink name="SearchPage" className={css.cityCard}>
            <Card className={classes.cityCard}>
              <CardActionArea>
                <CardMedia
                  component="img"
                  image={tempImg}
                  alt="Orlando"
                  className={classes.cityImage}
                />
                <CardContent>
                  <h2 className={css.cityName}>Orlando</h2>
                </CardContent>
              </CardActionArea>
            </Card>
          </NamedLink>
        </div>
      </div>
    </section>
  );
};

export default SectionCity;
