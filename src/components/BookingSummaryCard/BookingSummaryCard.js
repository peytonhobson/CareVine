import React, { useState, useCallback, useRef } from 'react';

import { Avatar, IconArrowHead } from '../../components';
import classNames from 'classnames';
import { useMediaQuery } from '@mui/material';

import css from './BookingSummaryCard.module.css';

const BookingSummaryCard = props => {
  const {
    currentAuthor,
    className,
    hideAvatar,
    subHeading,
    children,
    avatarText,
    bookingItems,
  } = props;

  const isLarge = useMediaQuery('(min-width:1024px)');
  const [showArrow, setShowArrow] = useState(false);

  const heightRef = useRef(null);

  const bookingItemsRef = useCallback(node => {
    if (node !== null && window.innerWidth <= 1024) {
      heightRef.current = node;
      node.addEventListener('scroll', () => {
        const isTop = node.scrollTop === 0;
        setShowArrow(isTop);
      });

      const resizeObserver = new ResizeObserver(() => {
        const isScrollable = node.scrollHeight > node.clientHeight;
        setShowArrow(isScrollable);
      });
      resizeObserver.observe(node);
    }
  }, []);

  const scrollToBottom = () => {
    if (heightRef.current) {
      // Smooth scroll to bottom
      heightRef.current.scrollTo({
        top: heightRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const authorDisplayName = currentAuthor?.attributes.profile.displayName;

  return (
    <div
      className={classNames(
        !isLarge ? css.detailsContainerMobile : css.detailsContainerDesktop,
        className
      )}
    >
      {!hideAvatar ? (
        <div className={css.cardAvatarWrapper}>
          <Avatar
            user={currentAuthor}
            disableProfileLink
            className={css.cardAvatar}
            initialsClassName={css.cardAvatarInitials}
          />
          <div>
            {avatarText || (
              <span className={!isLarge ? css.bookAuthorMobile : css.bookAuthor}>
                Book <span style={{ whiteSpace: 'nowrap' }}>{authorDisplayName}</span>
              </span>
            )}
          </div>
        </div>
      ) : null}
      <div className={css.summaryDetailsContainer}>
        <div className={css.detailsHeadings}>
          <h2 className={css.detailsTitle}>{subHeading || 'Booking Summary'}</h2>
        </div>
        <div className={css.bookingTimes} ref={bookingItemsRef}>
          {bookingItems}
          {showArrow ? (
            <IconArrowHead
              direction="down"
              height="0.9em"
              width="0.9em"
              className={css.arrow}
              onClick={scrollToBottom}
            />
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
};

export default BookingSummaryCard;
