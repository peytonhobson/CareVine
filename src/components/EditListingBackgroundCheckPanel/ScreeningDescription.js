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
const GOLD = 'gold';

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
      background: props.background,
      '&:hover': {
        backgroundColor: props.hoverBackgroundColor,
      },
    }),
  });

  const goldProps = {
    background:
      'radial-gradient(ellipse farthest-corner at right bottom, #FEDB37 0%, #FDB931 8%, #9f7928 30%, #8A6E2F 40%, transparent 80%), radial-gradient(ellipse farthest-corner at left top, #FFFFFF 0%, #FFFFAC 8%, #D1B464 25%, #5d4a1f 62.5%, #5d4a1f 100%) !important',
  };
  const greyProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
  };
  const goldClasses = useStyles(goldProps);
  const greyClasses = useStyles(greyProps);

  const goldButtonProps = {
    background:
      'radial-gradient(ellipse farthest-corner at right bottom, #FEDB37 0%, #FDB931 8%, #9f7928 30%, #8A6E2F 40%, transparent 80%), radial-gradient(ellipse farthest-corner at left top, #FFFFFF 0%, #FFFFAC 8%, #D1B464 25%, #5d4a1f 62.5%, #5d4a1f 100%) !important',
  };
  const greyButtonProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
    hoverBackgroundColor: 'var(--matterColor) !important',
  };
  const goldButtonClasses = useStyles(goldButtonProps);
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
                <p>Message families and apply to jobs</p>
              </li>
            </ul>
            <ul className={css.negativeList}>
              <li>
                <p>CareVine Gold badge to make your profile stand out</p>
              </li>
              <li>
                <p>Boosted listing to rank higher on the search board </p>
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
        <CardHeader title="CareVine Gold" className={goldClasses.root} />
        <CardContent>
          <div className={css.screeningTitleContainer}>
            <h2 className={css.screeningTitle}>Find jobs faster</h2>
            <p className={css.amountPerYear}>$4.99/month*</p>
          </div>
          <div className={css.benefitsListContainer}>
            <h3 style={{ width: '100%', marginBottom: '0' }}>Benefits</h3>
            <ul className={css.benefitsList}>
              <li>
                <p>Message families and apply to jobs</p>
              </li>
              <li>
                <p>CareVine Gold badge to make your profile stand out</p>
              </li>
              <li>
                <p>Boosted listing to rank higher on the search board </p>
              </li>
            </ul>
          </div>
        </CardContent>
        <CardActions>
          <Button className={goldButtonClasses.root} onClick={() => onPayForBC(GOLD)}>
            Pay for CareVine Gold
          </Button>
        </CardActions>
      </Card>
    </div>
  );
};

export default ScreeningDescription;
