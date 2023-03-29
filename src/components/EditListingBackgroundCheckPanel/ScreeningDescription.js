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
import { flexbox } from '@mui/system';
import IconCheckmark from '../IconCheckmark/IconCheckmark';

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
    display: 'flex',
    width: '25rem',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }));

  const CardActions = styled(props => <MuiCardActions {...props} />)(({ theme }) => ({
    paddingInline: '1rem',
    paddingBottom: '1.5rem',
    marginTop: 'auto',
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
      borderRadius: props.borderRadius,
      '&:hover': {
        backgroundColor: props.hoverBackgroundColor,
        brightness: props.hoverBrightness,
        filter: props.hoverFilter,
      },
    }),
  });

  const goldProps = {
    background:
      'linear-gradient(90deg, rgba(191, 149, 63, 1) 0%, rgba(203, 168, 75, 1) 3.06%, rgba(230, 210, 102, 1) 10.46%, rgba(246, 236, 118, 1) 16.27%, rgba(252, 246, 124, 1) 19.74%, rgba(224, 203, 91, 1) 33.88%, rgba(179, 135, 40, 1) 57.3%, rgba(188, 149, 50, 1) 61.6%, rgba(212, 185, 78, 1) 69.69%, rgba(250, 242, 121, 1) 80.6%, rgba(252, 246, 124, 1) 81.26%, rgba(249, 241, 120, 1) 84.27%, rgba(240, 228, 110, 1) 87.68%, rgba(225, 205, 93, 1) 91.29%, rgba(205, 173, 69, 1) 95.03%, rgba(179, 133, 38, 1) 98.85%, rgba(170, 119, 28, 1) 100%) !important',
  };
  const greyProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
  };
  const goldClasses = useStyles(goldProps);
  const greyClasses = useStyles(greyProps);

  const goldButtonProps = {
    background:
      'linear-gradient(90deg, rgba(191, 149, 63, 1) 0%, rgba(203, 168, 75, 1) 3.06%, rgba(230, 210, 102, 1) 10.46%, rgba(246, 236, 118, 1) 16.27%, rgba(252, 246, 124, 1) 19.74%, rgba(224, 203, 91, 1) 33.88%, rgba(179, 135, 40, 1) 57.3%, rgba(188, 149, 50, 1) 61.6%, rgba(212, 185, 78, 1) 69.69%, rgba(250, 242, 121, 1) 80.6%, rgba(252, 246, 124, 1) 81.26%, rgba(249, 241, 120, 1) 84.27%, rgba(240, 228, 110, 1) 87.68%, rgba(225, 205, 93, 1) 91.29%, rgba(205, 173, 69, 1) 95.03%, rgba(179, 133, 38, 1) 98.85%, rgba(170, 119, 28, 1) 100%) !important',
    borderRadius: 'var(--borderRadius)',
    hoverFilter: 'brightness(70%)',
  };
  const greyButtonProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
    hoverBackgroundColor: 'var(--matterColor) !important',
    borderRadius: 'var(--borderRadius)',
  };
  const goldButtonClasses = useStyles(goldButtonProps);
  const greyButtonClasses = useStyles(greyButtonProps);

  return (
    <div>
      <div className={css.bcDescriptionContainer}>
        <p className={css.backgroundCheckDescription}>
          Background checks are required to verify your identity and criminal history. CareVine Gold
          is a paid subscription that allows you to stand out from other caregivers and get more job
          opportunities.
        </p>
      </div>
      <div className={css.screeningRoot}>
        <Card className={css.basicCard}>
          <CardHeader title="CareVine Basic" className={greyClasses.root} />
          <CardContent>
            <div className={css.screeningTitleContainer}>
              <h2 className={css.screeningTitle}>Complete a background check</h2>
              <p className={css.amountPerYear}>$14.99/year</p>
            </div>
            <div className={css.benefitsListContainer}>
              <h3 style={{ width: '100%', marginBottom: '0' }}>Benefits</h3>
              <ul className={css.benefitsList}>
                <li>
                  <p>Message families and apply to jobs</p>
                </li>
                <li>
                  <p>Basic background check</p>
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
              Pay for CareVine Basic
            </Button>
          </CardActions>
        </Card>
        <Card className={css.vineCheckCard}>
          <CardHeader title="CareVine Gold" className={goldClasses.root} />
          <CardContent>
            <div className={css.screeningTitleContainer}>
              <h2 className={css.screeningTitle}>Find jobs faster</h2>
              <p className={css.amountPerYear}>$4.99/month</p>
            </div>
            <div className={css.benefitsListContainer}>
              <h3 style={{ width: '100%', marginBottom: '0' }}>Benefits</h3>
              <ul className={css.benefitsList}>
                <li>
                  <p>Message families and apply to jobs</p>
                </li>
                <li>
                  <p>Premium background check</p>
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
              Get CareVine Gold
            </Button>
          </CardActions>
        </Card>
      </div>
      <p className={css.disclaimer}>
        CareVine does not hire or assume liability for any provider or care seeker. The
        responsibility for choosing a suitable caregiver or job and adhering to relevant laws rests
        with you. CareVine neither creates nor authenticates data found in profiles, job postings,
        or listings.
      </p>
    </div>
  );
};

export default ScreeningDescription;
