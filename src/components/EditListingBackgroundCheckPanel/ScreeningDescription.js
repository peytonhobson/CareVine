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
      'linear-gradient(90deg,rgba(204, 153, 51, 1) 0%,rgba(211, 167, 62, 1) 5.56%,rgba(230, 203, 91, 1) 16.05%,rgba(252, 246, 124, 1) 26.53%,rgba(243, 232, 114, 1) 32.08%,rgba(219, 196, 86, 1) 42.5%,rgba(181, 138, 42, 1) 56.59%,rgba(179, 135, 40, 1) 57.3%,rgba(252, 246, 124, 1) 81.26%,rgba(250, 241, 120, 1) 84.84%,rgba(243, 228, 110, 1) 88.89%,rgba(231, 205, 92, 1) 93.18%,rgba(215, 173, 67, 1) 97.6%,rgba(204, 153, 51, 1) 100%) !important',
  };
  const greyProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
  };
  const goldClasses = useStyles(goldProps);
  const greyClasses = useStyles(greyProps);

  const goldButtonProps = {
    background:
      'linear-gradient(90deg,rgba(204, 153, 51, 1) 0%,rgba(211, 167, 62, 1) 5.56%,rgba(230, 203, 91, 1) 16.05%,rgba(252, 246, 124, 1) 26.53%,rgba(243, 232, 114, 1) 32.08%,rgba(219, 196, 86, 1) 42.5%,rgba(181, 138, 42, 1) 56.59%,rgba(179, 135, 40, 1) 57.3%,rgba(252, 246, 124, 1) 81.26%,rgba(250, 241, 120, 1) 84.84%,rgba(243, 228, 110, 1) 88.89%,rgba(231, 205, 92, 1) 93.18%,rgba(215, 173, 67, 1) 97.6%,rgba(204, 153, 51, 1) 100%) !important',
  };
  const greyButtonProps = {
    backgroundColor: 'var(--matterColorAnti) !important',
    hoverBackgroundColor: 'var(--matterColor) !important',
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
          <CardHeader title="Basic Background Check" className={greyClasses.root} />
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
                  <p>Basic Screening</p>
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
              <p className={css.amountPerYear}>$4.99/month</p>
            </div>
            <div className={css.benefitsListContainer}>
              <h3 style={{ width: '100%', marginBottom: '0' }}>Benefits</h3>
              <ul className={css.benefitsList}>
                <li>
                  <p>Message families and apply to jobs</p>
                </li>
                <li>
                  <p>Premium Screening</p>
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
    </div>
  );
};

export default ScreeningDescription;
