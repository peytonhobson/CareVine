import React, { useState } from 'react';

import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { IconSpinner, IconClose, InlineTextButton, TimeRange, Modal, InfoTooltip } from '../';
import { EditListingAvailabilityExceptionForm } from '../../forms';
import {
  LISTING_STATE_DRAFT,
  DATE_TYPE_DATETIME,
  DATE_TYPE_DATE,
  propTypes,
} from '../../util/types';
import { timestampToDate } from '../../util/dates';

import css from './CareScheduleExceptions.module.css';

const MAX_EXCEPTIONS_COUNT = 20;
const AVAILABILITY_PLAN_TYPE_REPEAT = 'repeat';
const AVAILABILITY_PLAN_TYPE_24HOUR = '24hour';

// Ensure that the AvailabilityExceptions are in sensible order.
//
// Note: if you allow fetching more than 100 exception,
// pagination kicks in and that makes client-side sorting impossible.
const sortExceptionsByStartTime = (a, b) => {
  return a.attributes.start - b.attributes.start;
};

const filterExceptionsByType = (exceptions, planType) => {
  return exceptions.filter(exception => {
    return planType === AVAILABILITY_PLAN_TYPE_REPEAT
      ? exception.attributes.seats === 1 || exception.attributes.seats === 0
      : exception.attributes.seats === 3 || exception.attributes.seats === 2;
  });
};

const CareScheduleExceptions = props => {
  const {
    rootClassName,
    className,
    fetchExceptionsInProgress,
    availabilityExceptions,
    onDeleteAvailabilityException,
    onManageDisableScrolling,
    careSchedule,
    updateInProgress,
    errors,
    disabled,
    ready,
    listing,
    onSave,
    onDelete,
    isCaregiver,
  } = props;

  const [isEditExceptionsModalOpen, setIsEditExceptionsModalOpen] = useState(false);

  const planType = careSchedule?.type;
  const isRecurring = planType === AVAILABILITY_PLAN_TYPE_REPEAT;

  const sortedAvailabilityExceptions = filterExceptionsByType(
    availabilityExceptions.sort(sortExceptionsByStartTime),
    planType
  );
  const exceptionCount = (sortedAvailabilityExceptions && sortedAvailabilityExceptions.length) || 0;

  const { deleteExceptionError, fetchExceptionsError } = errors || {};

  const exceptionsTooltipText = (
    <div>
      <p>
        <FormattedMessage id="CareScheduleExceptions.exceptionTooltip" />
      </p>
    </div>
  );

  // Save exception click handler
  const saveException = values => {
    const { availability, exceptionStartTime, exceptionEndTime } = values;

    const available = availability === 'available' || availability === 'care-needed';

    const seats = isRecurring ? (available ? 1 : 0) : available ? 3 : 2;

    onSave({
      listingId: listing.id.uuid,
      attributes: {
        seats,
        start: exceptionStartTime,
        end: exceptionEndTime,
      },
    });

    setIsEditExceptionsModalOpen(false);
  };

  const openExceptionsModal = e => {
    e.preventDefault();
    setIsEditExceptionsModalOpen(true);
  };

  return (
    <>
      <section className={css.section}>
        <header className={css.sectionHeader}>
          <h2 className={css.sectionTitle}>
            {fetchExceptionsInProgress ? (
              <FormattedMessage id="CareScheduleExceptions.availabilityExceptionsTitleNoCount" />
            ) : (
              <FormattedMessage
                id="CareScheduleExceptions.availabilityExceptionsTitle"
                values={{ count: exceptionCount }}
              />
            )}
          </h2>
          <InfoTooltip title={exceptionsTooltipText} />
        </header>

        {deleteExceptionError ? (
          <p className={css.error}>
            <FormattedMessage id="CareScheduleExceptions.deleteExceptionFailed" />
          </p>
        ) : null}
        {fetchExceptionsInProgress ? (
          <div className={css.exceptionsLoading}>
            <IconSpinner />
          </div>
        ) : fetchExceptionsError ? (
          <div className={css.error}>
            <FormattedMessage id="CareScheduleExceptions.fetchExceptionsError" />
          </div>
        ) : exceptionCount === 0 ? null : (
          <div className={css.exceptions}>
            {sortedAvailabilityExceptions.map(availabilityException => {
              const { start, end, seats } = availabilityException.attributes;
              return (
                <div key={start} className={css.exception}>
                  <div className={css.exceptionHeader}>
                    <div className={css.exceptionAvailability}>
                      <div
                        className={classNames(css.exceptionAvailabilityDot, {
                          [css.isAvailable]: seats % 2 !== 0,
                        })}
                      />
                      <div className={css.exceptionAvailabilityStatus}>
                        {isCaregiver ? (
                          seats % 2 !== 0 ? (
                            <FormattedMessage id="CareScheduleExceptions.exceptionAvailable" />
                          ) : (
                            <FormattedMessage id="CareScheduleExceptions.exceptionNotAvailable" />
                          )
                        ) : seats % 2 !== 0 ? (
                          <FormattedMessage id="CareScheduleExceptions.exceptionCareNeeded" />
                        ) : (
                          <FormattedMessage id="CareScheduleExceptions.exceptionCareNotNeeded" />
                        )}
                      </div>
                    </div>
                    <button
                      className={css.removeExceptionButton}
                      onClick={() => onDelete(start)}
                      type="button"
                    >
                      <IconClose size="normal" className={css.removeIcon} />
                    </button>
                  </div>
                  {seats === 1 ? (
                    <TimeRange
                      className={css.timeRange}
                      startDate={timestampToDate(start)}
                      endDate={timestampToDate(end)}
                      dateType={DATE_TYPE_DATETIME}
                      timeZone={careSchedule.timezone}
                    />
                  ) : (
                    <TimeRange
                      className={css.timeRange}
                      startDate={timestampToDate(start)}
                      endDate={timestampToDate(end)}
                      dateType={DATE_TYPE_DATE}
                      timeZone={careSchedule.timezone}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
        {exceptionCount <= MAX_EXCEPTIONS_COUNT ? (
          <InlineTextButton
            className={css.addExceptionButton}
            onClick={openExceptionsModal}
            disabled={disabled}
            ready={ready}
            type="button"
          >
            <FormattedMessage id="CareScheduleExceptions.addException" />
          </InlineTextButton>
        ) : null}
      </section>
      {onManageDisableScrolling ? (
        <Modal
          id="EditAvailabilityExceptions"
          isOpen={isEditExceptionsModalOpen}
          onClose={() => setIsEditExceptionsModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <EditListingAvailabilityExceptionForm
            formId="EditListingAvailabilityExceptionForm"
            onSubmit={saveException}
            timeZone={careSchedule?.timezone}
            availabilityExceptions={sortedAvailabilityExceptions}
            updateInProgress={updateInProgress}
            fetchErrors={errors}
            planType={planType}
            isCaregiver={isCaregiver}
          />
        </Modal>
      ) : null}
    </>
  );
};

export default CareScheduleExceptions;
