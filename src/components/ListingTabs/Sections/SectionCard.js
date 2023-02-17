import React, { forwardRef } from 'react';

import { Card as MuiCard, CardHeader as MuiCardHeader, CardContent } from '@mui/material';
import { styled } from '@material-ui/styles';
import classNames from 'classnames';

import css from './sections.module.css';

const SectionCard = forwardRef((props, ref) => {
  const { rootClassName, className, children, title, ...rest } = props;
  const classes = classNames(rootClassName || css.section, className);

  const CardHeader = styled(props => <MuiCardHeader {...props} />)(({ theme }) => ({
    textAlign: 'left',
    display: 'block',
    width: '100%',
    '& .MuiCardHeader-title': {
      composes: 'h1 from global',
      color: 'var(--matterColor)',
      fontFamily: 'var(--fontFamily)',
      fontWeight: 'var(--fontWeightSemiBold)',
    },
  }));

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    minHeight: '10rem',
  }));

  return (
    <div className={classes} ref={ref}>
      <Card>
        <CardHeader title={title} />
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
});

export default SectionCard;
