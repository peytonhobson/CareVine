import React from 'react';

import {
  Card as MuiCard,
  CardContent,
  CardHeader as MuiCardHeader,
  styled,
  CardActions as MuiCardActions,
  Button as MuiButton,
} from '@mui/material';

import css from './SubscriptionsPage.module.css';

const SubscriptionCard = props => {
  const { title, children, headerButton } = props;

  const CardHeader = styled(props => <MuiCardHeader {...props} />)(({ theme }) => ({
    display: 'flex',
    flexShrink: '1 !important',
    flexDirection: 'row',
    '& .MuiCardHeader-title': {
      fontFamily: 'var(--fontFamily)',
      fontWeight: 'var(--fontWeightSemiBold)',
    },
  }));

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    display: 'block',
  }));

  return (
    <Card className={css.backgroundCheckSubscription}>
      <div className={css.headerContainer}>
        <CardHeader title={title} />
        <span className={css.headerButtonContainer}>{headerButton}</span>
      </div>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default SubscriptionCard;
