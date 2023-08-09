import React, { forwardRef } from 'react';

import {
  Card as MuiCard,
  CardHeader as MuiCardHeader,
  CardContent as MuiCardContent,
} from '@mui/material';
import { styled } from '@material-ui/styles';
import classNames from 'classnames';
import { useCheckMobileScreen } from '../../../util/hooks';

import css from './sections.module.css';

const SectionCard = forwardRef((props, ref) => {
  const {
    rootClassName,
    className,
    children,
    title,
    headerStyles,
    cardStyles,
    cardContentStyles,
    ...rest
  } = props;
  const classes = classNames(rootClassName || css.section, className);

  const isMobile = useCheckMobileScreen();

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
    ...headerStyles,
  }));

  const Card = styled(props => <MuiCard {...props} />)(({ theme }) => ({
    minHeight: '10rem',
    marginInline: isMobile ? '1rem' : '0',
    padding: '1rem',
    '&.MuiPaper-rounded': {
      borderRadius: 'var(--borderRadius)',
    },
    ...cardStyles,
  }));

  const CardContent = styled(props => <MuiCardContent {...props} />)(({ theme }) => ({
    ...cardContentStyles,
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
