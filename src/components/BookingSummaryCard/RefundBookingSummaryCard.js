import React, { useState, useCallback } from 'react';

import classNames from 'classnames';
import { useMediaQuery } from '@mui/material';
import { addTimeToStartOfDay } from '../../util/dates';
import { convertTimeFrom12to24 } from '../../util/data';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

import css from './BookingSummaryCard.module.css';

const TRANSACTION_FEE = 0.05;

const calculateTimeBetween = (bookingStart, bookingEnd) => {
  const start = convertTimeFrom12to24(bookingStart).split(':')[0];
  const end = bookingEnd === '12:00am' ? 24 : convertTimeFrom12to24(bookingEnd).split(':')[0];

  return end - start;
};

const filterFiftyPercentRefund = lineItems =>
  lineItems
    ?.filter(l => {
      const differenceInHours = addTimeToStartOfDay(l.date, l.startTime) - moment().toDate();
      return differenceInHours < 48 * 36e5 && differenceInHours > 0;
    })
    .map(l => ({ ...l, amount: l.amount / 2 }));

const filterFullRefund = lineItems =>
  lineItems?.filter(l => {
    const startTime = addTimeToStartOfDay(l.date, l.startTime);
    return startTime - moment().toDate() > 48 * 36e5;
  });

const RefundBookingSummaryCard = props => {
  const { lineItems, className, subHeading } = props;

  const isLarge = useMediaQuery('(min-width:1024px)');
  const [showArrow, setShowArrow] = useState(true);

  const heightRef = useRef(null);
  const clientHeight = heightRef.current?.clientHeight;
  const scrollHeight = heightRef.current?.scrollHeight;

  useEffect(() => {
    if (scrollHeight > clientHeight) {
      setShowArrow(true);
    }
  }, [clientHeight, scrollHeight]);

  const cardRef = useCallback(node => {
    if (node !== null && window.innerWidth >= 1024) {
      node.addEventListener('scroll', () => {
        const isTop = node.scrollTop === 0;
        setShowArrow(isTop);
      });
    }
  }, []);

  const fiftyPercentRefund = filterFiftyPercentRefund(lineItems) ?? [];
  const fullRefund = filterFullRefund(lineItems) ?? [];
  const subTotal =
    fiftyPercentRefund.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) +
    fullRefund.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
  const bookingFee = parseFloat(subTotal * TRANSACTION_FEE).toFixed(2);
  const total = subTotal + Number(bookingFee);

  return (
    <div
      className={classNames(
        !isLarge ? css.detailsContainerMobile : css.detailsContainerDesktop,
        className
      )}
      ref={cardRef}
    >
      <div className={css.summaryDetailsContainer}>
        <div className={css.detailsHeadings}>
          <h2 className={css.detailsTitle}>{subHeading || 'Refund Summary'}</h2>
        </div>
        <div className={css.bookingTimes}></div>
        <div className={css.totalContainer}>
          <div className={css.totalCalc}>
            <h4 className={css.paymentCalc}>
              + CareVine Service Fee Refund - ${parseFloat(bookingFee).toFixed(2)}
            </h4>
          </div>
          <h3 className={css.total}>Total Refund: ${parseFloat(total).toFixed(2)}</h3>
        </div>
      </div>
      {showArrow ? (
        <IconArrowHead direction="down" height="1.5em" width="1.5em" className={css.arrow} />
      ) : null}
    </div>
  );
};

export default RefundBookingSummaryCard;
