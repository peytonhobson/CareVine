import React from 'react';

import {
  Card as MuiCard,
  CardContent,
  CardHeader as MuiCardHeader,
  styled,
  CardActions as MuiCardActions,
  Button as MuiButton,
} from '@mui/material';

import css from './EditListingBackgroundCheckPanel.module.css';

const ScreeningDescription = props => {
  const { onPayForBC } = props;

  const CardHeader = styled(props => <MuiCardHeader {...props} />)(({ theme }) => ({
    textAlign: 'center',
    display: 'block',
    width: '100%',
    backgroundColor: 'var(--marketplaceColor)',
    '& .MuiCardHeader-title': {
      color: 'var(--matterColorLight)',
      fontFamily: 'var(--fontFamily)',
      fontWeight: 'var(--fontWeightSemiBold)',
    },
  }));

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    display: 'block',
    width: '35rem',
  }));

  const CardActions = styled(props => <MuiCardActions {...props} />)(({ theme }) => ({
    paddingInline: '3rem',
    paddingBottom: '1.5rem',
  }));

  const Button = styled(props => <MuiButton {...props} />)(({ theme }) => ({
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--marketplaceColor)',
    color: 'var(--matterColorLight)',
    fontFamily: 'var(--fontFamily)',
    fontWeight: 'var(--fontWeightSemiBold)',
    fontSize: 'var(--fontSizeBase)',
    borderRadius: 'var(--borderRadiusBase)',
    paddingBlock: '1rem',
    '&:hover': {
      backgroundColor: 'var(--marketplaceColorDark)',
      color: 'var(--matterColorLight)',
      boxShadow: 'var(--boxShadowButton)',
    },
  }));

  return (
    <Card>
      <CardHeader title="Basic Background Check" />
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
            <li>
              <p>Be booked directly from employers</p>
            </li>
            <li>
              <p>Receive payment directly</p>
            </li>
          </ul>
        </div>
      </CardContent>
      <CardActions>
        <Button className={css.payButton} onClick={onPayForBC}>
          Pay for background check
        </Button>
      </CardActions>
    </Card>
  );
};

export default ScreeningDescription;
