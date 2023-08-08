import React, { useEffect, useState } from 'react';

import { Modal, FieldRangeSlider, Button } from '../../components';

import css from './BookingSummaryCard.module.css';

const ChangeRatesModal = props => {
  const { isOpen, form, onManageDisableScrolling, minPrice, formValues, onClose } = props;

  const [bookingRateOnOpen, setBookingRateOnOpen] = useState(formValues?.bookingRate);

  useEffect(() => {
    setBookingRateOnOpen(formValues?.bookingRate);
  }, []);

  const bookingRate = formValues?.bookingRate ?? minPrice / 100;

  return (
    <Modal
      id="changeRatesModal"
      isOpen={isOpen}
      onClose={() => {
        form.change('bookingRate', bookingRateOnOpen);
        onClose();
      }}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      <h2 className={css.fieldLabel}>Choose an hourly rate:</h2>
      <h1 className={css.fieldLabel} style={{ marginBottom: 0 }}>
        ${bookingRate}
      </h1>
      <div className={css.availableRatesContainer}>
        <p>${minPrice / 100}</p>
        <p>$50</p>
      </div>
      <FieldRangeSlider
        id="bookingRate"
        name="bookingRate"
        className={css.priceRange}
        trackClass={css.track}
        min={minPrice / 100}
        max={50}
        step={1}
        handles={[bookingRate]}
        noHandleLabels
      />
      <Button type="submit" className={css.submitRateButton} onClick={onClose}>
        Save Rate
      </Button>
    </Modal>
  );
};

export default ChangeRatesModal;
