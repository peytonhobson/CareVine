import React from 'react';

import {
  Card as MuiCard,
  CardContent,
  CardHeader as MuiCardHeader,
  styled,
  CardActions as MuiCardActions,
  Button as MuiButton,
} from '@mui/material';
import { makeStyles } from '@material-ui/styles';

import css from './EditListingBackgroundCheckPanel.module.css';

const BASIC = 'basic';
const VINE_CHECK = 'vineCheck';

const ScreeningDescription = props => {
  const { onPayForBC } = props;

  const CardHeader = styled(props => <MuiCardHeader {...props} />)(({ theme }) => ({
    textAlign: 'center',
    display: 'block',
    width: '100%',
    '& .MuiCardHeader-title': {
      color: 'var(--matterColorLight)',
      fontFamily: 'var(--fontFamily)',
      fontWeight: 'var(--fontWeightSemiBold)',
    },
  }));

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    display: 'block',
    width: '25rem',
  }));

  const CardActions = styled(props => <MuiCardActions {...props} />)(({ theme }) => ({
    paddingInline: '1rem',
    paddingBottom: '1.5rem',
  }));

  const Button = styled(props => <MuiButton {...props} />)(({ theme }) => ({
    width: '100%',
    height: '100%',
    color: 'var(--matterColorLight)',
    fontFamily: 'var(--fontFamily)',
    fontWeight: 'var(--fontWeightSemiBold)',
    fontSize: 'var(--fontSizeBase)',
    borderRadius: 'var(--borderRadiusBase)',
    paddingBlock: '1rem',
    marginTop: 'auto',
    '&:hover': {
      color: 'var(--matterColorLight)',
      boxShadow: 'var(--boxShadowButton)',
    },
  }));

  const useStyles = makeStyles({
    root: props => ({
      backgroundColor: props.backgroundColor,
      '&:hover': {
        backgroundColor: props.hoverBackgroundColor,
      },
    }),
  });

  const greenProps = {
    backgroundColor: 'var(--marketplaceColor) !important',
  };
  const greyProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
  };
  const greenClasses = useStyles(greenProps);
  const greyClasses = useStyles(greyProps);

  const greenButtonProps = {
    backgroundColor: 'var(--marketplaceColor) !important',
    hoverBackgroundColor: 'var(--marketplaceColorDark) !important',
  };
  const greyButtonProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
    hoverBackgroundColor: 'var(--matterColor) !important',
  };
  const greenButtonClasses = useStyles(greenButtonProps);
  const greyButtonClasses = useStyles(greyButtonProps);

  return (
    <div className={css.screeningRoot}>
      <Card className={css.basicCard}>
        <CardHeader title="Basic Background Check" className={greyClasses.root} />
        <CardContent>
          <div className={css.screeningTitleContainer}>
            <h2 className={css.screeningTitle}>Complete a background check</h2>
            <p className={css.amountPerYear}>$14.99/year*</p>
          </div>
          <div className={css.benefitsListContainer}>
            <h3 style={{ width: '100%', marginBottom: '0' }}>Benefits</h3>
            <ul className={css.benefitsList}>
              <li>
                <p>Message employers</p>
              </li>
              <li>
                <p>Apply to jobs</p>
              </li>
            </ul>
            <ul className={css.negativeList}>
              <li>
                <p>Vine Check badge to inform employers you are safe</p>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardActions>
          <Button className={greyButtonClasses.root} onClick={() => onPayForBC(BASIC)}>
            Pay for background check
          </Button>
        </CardActions>
      </Card>
      <Card className={css.vineCheckCard}>
        <CardHeader title="Vine Check" className={greenClasses.root} />
        <CardContent>
          <div className={css.screeningTitleContainer}>
            <h2 className={css.screeningTitle}>Make your profile stand out</h2>
            <p className={css.amountPerYear}>$4.99/month*</p>
          </div>
          <div className={css.benefitsListContainer}>
            <h3 style={{ width: '100%', marginBottom: '0' }}>Benefits</h3>
            <ul className={css.benefitsList}>
              <li>
                <p>Message employers</p>
              </li>
              <li>
                <p>Apply to jobs</p>
              </li>
              <li>
                <p>Vine Check badge to inform employers you are safe</p>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardActions>
          <Button className={greenButtonClasses.root} onClick={() => onPayForBC(VINE_CHECK)}>
            Pay for Vine Check
          </Button>
        </CardActions>
      </Card>
    </div>
  );
};

export default ScreeningDescription;
