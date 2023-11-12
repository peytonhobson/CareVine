import React, { useState, useEffect, useMemo } from 'react';

import { Modal, CancelButton, Button, PrimaryButton, SecondaryButton } from '../..';
import classNames from 'classnames';
import moment from 'moment';

import css from './BookingCardModals.module.css';

const MAIN_ACTIONS = 'mainActions';
const MODIFY_SCHEDULE_ACTIONS = 'modifyScheduleActions';

const ActionsModal = props => {
  const [displayState, setDisplayState] = useState(MAIN_ACTIONS);

  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    onModalOpen,
    booking,
    modalTypes,
    availableActions,
    actionsDisplayState,
    onSetActionsDisplayState,
  } = props;

  useEffect(() => {
    if (actionsDisplayState) {
      setDisplayState(actionsDisplayState);
      onSetActionsDisplayState(null);
    }
  }, [actionsDisplayState]);

  const {
    type: bookingType,
    endDate: oldEndDate = moment()
      .add(10, 'years')
      .format(ISO_OFFSET_FORMAT),
    chargedLineItems = [],
  } = booking.attributes.metadata;

  const buttonClass = classNames(css.dropAnimation, 'w-auto py-2 px-4 mt-4');

  const handleModifyScheduleClick = () => {
    if (bookingType === 'recurring') {
      setDisplayState(MODIFY_SCHEDULE_ACTIONS);
    } else {
      onModalOpen(modalTypes.MODIFY_SCHEDULE_ONE_TIME);
    }
  };

  // Used to determine if the user can select future end dates to change to
  const endDateCharged = useMemo(
    () =>
      oldEndDate
        ? chargedLineItems
            .map(item => item.lineItems?.map(i => i.date))
            .flat()
            .some(d => moment(d).isSame(oldEndDate, 'day'))
        : false,
    [chargedLineItems, oldEndDate]
  );

  return isOpen ? (
    <Modal
      title="Dispute Booking"
      id="DisputeBookingModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
    >
      {displayState === MAIN_ACTIONS ? (
        <>
          <p className={css.modalTitle}>What would you like to do?</p>
          <div className="flex flex-col gap-4 pt-6">
            {availableActions.cancel ? (
              <CancelButton onClick={() => onModalOpen(modalTypes.CANCEL)} className={buttonClass}>
                Cancel Booking
              </CancelButton>
            ) : null}
            {availableActions.modifySchedule ? (
              <Button onClick={handleModifyScheduleClick} className={buttonClass}>
                Modify Schedule
              </Button>
            ) : null}
            {availableActions.changePaymentMethod ? (
              <PrimaryButton
                onClick={() => onModalOpen(modalTypes.CHANGE_PAYMENT_METHOD)}
                className={buttonClass}
              >
                Change Payment Method
              </PrimaryButton>
            ) : null}
            {availableActions.dispute ? (
              <SecondaryButton
                onClick={() => onModalOpen(modalTypes.DISPUTE)}
                className={buttonClass}
              >
                Submit Dispute
              </SecondaryButton>
            ) : null}
          </div>
        </>
      ) : null}

      {displayState === MODIFY_SCHEDULE_ACTIONS ? (
        <>
          <p className={css.modalTitle}>What would you like to do?</p>
          <div className="flex flex-col gap-4 pt-6">
            <Button onClick={() => onModalOpen(modalTypes.CHANGE_END_DATE)} className={buttonClass}>
              Change End Date
            </Button>
            {!endDateCharged ? (
              <>
                <PrimaryButton
                  onClick={() => onModalOpen(modalTypes.MODIFY_SCHEDULE_RECURRING)}
                  className={buttonClass}
                >
                  Change Schedule
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => onModalOpen(modalTypes.MODIFY_EXCEPTIONS)}
                  className={buttonClass}
                >
                  Change Exceptions
                </SecondaryButton>
              </>
            ) : null}
            <div className="pt-16 flex justify-end">
              <Button onClick={() => setDisplayState(MAIN_ACTIONS)} className="w-[10rem]">
                Go Back
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </Modal>
  ) : null;
};

export default ActionsModal;
