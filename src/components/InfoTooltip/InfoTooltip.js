import * as React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import MuiIconButton from '@mui/material/IconButton';
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const InfoTooltip = props => {
  const { title, icon, styles, onClick } = props;

  const IconButton = styled(MuiIconButton)({
    paddingBlock: '0',
    '&:hover': {
      backgroundColor: 'transparent',
    },
    ...styles,
  });

  return (
    <Tooltip title={title} disableInteractive placement="top">
      <IconButton onClick={onClick} disableTouchRipple>
        {icon || <InfoIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default InfoTooltip;
