import React from 'react';

import { styled } from '@mui/material/styles';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const Accordion = styled(props => <MuiAccordion disableGutters elevation={0} square {...props} />)(
  ({ theme }) => ({
    '&:before': {
      display: 'none',
    },
  })
);

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: '0 3.5rem',
  color: '#828282',
  transition: 'height 1000ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
}));

const FAQAccordion = props => {
  const { summary, details, isOpen, onChange } = props;

  const ArrowDropDownIcon = styled(MuiArrowDropDownIcon)(({ theme }) => ({
    fill: isOpen && 'var(--marketplaceColor)',
  }));

  const AccordionSummary = styled(props => <MuiAccordionSummary {...props} />)(({ theme }) => ({
    flexDirection: 'row-reverse',
    color: isOpen && 'var(--marketplaceColor)',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(180deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1),
    },
  }));

  return (
    <Accordion expanded={isOpen} onChange={onChange}>
      <AccordionSummary expandIcon={<ArrowDropDownIcon sx={{ fontSize: '2rem' }} />}>
        {summary}
      </AccordionSummary>
      <AccordionDetails>{details}</AccordionDetails>
    </Accordion>
  );
};

export default FAQAccordion;
