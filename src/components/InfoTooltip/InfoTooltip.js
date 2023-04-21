import React, { useState } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import MuiIconButton from '@mui/material/IconButton';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import { useCheckMobileScreen } from '../../util/hooks';

const InfoTooltip = props => {
  const { title, icon, styles, onClick } = props;

  const [showTooltip, setShowTooltip] = useState(false);

  const isMobile = useCheckMobileScreen();

  const IconButton = styled(MuiIconButton)({
    paddingBlock: '0',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    ...styles,
  });

  return (
    <Tooltip
      title={title}
      open={showTooltip}
      onOpen={() => setShowTooltip(true)}
      onClose={() => setShowTooltip(false)}
      disableInteractive
      placement="top"
      enterTouchDelay={isMobile ? 0 : 700}
    >
      <IconButton onClick={isMobile ? () => setShowTooltip(!showTooltip) : onClick}>
        {icon || <InfoIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default InfoTooltip;
