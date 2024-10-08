import React, { useState } from 'react';
import {
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionSummary as MuiAccordionSummary,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Accordion = props => {
  const {
    className,
    label,
    children,
    accordionStyles,
    summaryStyles,
    detailStyles,
    onChange,
  } = props;

  const Accordion = styled(props => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
  ))(({ theme }) => ({
    ...accordionStyles,
  }));

  const AccordionSummary = styled(props => (
    <MuiAccordionSummary expandIcon={<ExpandMoreIcon />} {...props} />
  ))(({ theme }) => ({
    ...theme,
    ...summaryStyles,
  }));

  const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    ...detailStyles,
  }));

  return (
    <Accordion className={className}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>{label}</AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

export default Accordion;
