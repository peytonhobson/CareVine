import React, { useState } from 'react';

import { FormattedMessage } from '../../util/reactIntl';
import { timestampToDate } from '../../util/dates';
import { InlineTextButton, TimeRange, Modal, InfoTooltip, IconClose } from '..';
import { EditListingAvailabilityExceptionForm } from '../../forms';
import classNames from 'classnames';
import { DATE_TYPE_DATETIME } from '../../util/types';

import css from './AvailabilityPlanExceptions.module.css';

const sortExceptionsByStartTime = (a, b) => {
  return a.attributes.start.getTime() - b.attributes.start.getTime();
};

const MAX_EXCEPTIONS_COUNT = 100;

const AvailabilityPlanExceptions = props => {
  const {
    fetchExceptionsInProgress,
    availabilityExceptions,
    onDeleteAvailabilityException,
    onAddAvailabilityException,
    onManageDisableScrolling,
    disabled,
    ready,
    availabilityPlan,
    updateInProgress,
    errors,
    listing,
    addExceptionInProgress,
  } = props;

  const [isEditExceptionsModalOpen, setIsEditExceptionsModalOpen] = useState(false);

  const exceptionCount = availabilityExceptions ? availabilityExceptions.length : 0;
  const sortedAvailabilityExceptions = availabilityExceptions.sort(sortExceptionsByStartTime);
  const exceptionsTooltipText = (
    <div>
      <p>
        <FormattedMessage id="CareScheduleExceptions.exceptionTooltip" />
      </p>
    </div>
  );

  const saveException = values => {
    const { availability, exceptionStartTime, exceptionEndTime } = values;

    // TODO: add proper seat handling
    const seats = availability === 'available' ? 1 : 0;

    return onAddAvailabilityException({
      listingId: listing.id,
      seats,
      start: timestampToDate(exceptionStartTime),
      end: timestampToDate(exceptionEndTime),
    })
      .then(() => {
        setIsEditExceptionsModalOpen(false);
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  return (
    <section className={css.section}>
      <header className={css.sectionHeader}>
        <h2 className={css.sectionTitle}>
          <FormattedMessage
            id="AvailabilityPlanExceptions.availabilityExceptionsTitle"
            values={{ count: exceptionCount }}
          />
          <InfoTooltip title={exceptionsTooltipText} />
        </h2>
      </header>
      {fetchExceptionsInProgress ? (
        <div className={css.exceptionsLoading}>
          <IconSpinner />
        </div>
      ) : (
        <div className={css.exceptions}>
          {sortedAvailabilityExceptions.map(availabilityException => {
            const { start, end, seats } = availabilityException.attributes;
            return (
              <div key={availabilityException.id.uuid} className={css.exception}>
                <div className={css.exceptionHeader}>
                  <div className={css.exceptionAvailability}>
                    <div
                      className={classNames(css.exceptionAvailabilityDot, {
                        [css.isAvailable]: seats > 0,
                      })}
                    />
                    <div className={css.exceptionAvailabilityStatus}>
                      {seats > 0 ? (
                        <FormattedMessage id="AvailabilityPlanExceptions.exceptionAvailable" />
                      ) : (
                        <FormattedMessage id="AvailabilityPlanExceptions.exceptionNotAvailable" />
                      )}
                    </div>
                  </div>
                  <button
                    className={css.removeExceptionButton}
                    onClick={() => onDeleteAvailabilityException({ id: availabilityException.id })}
                  >
                    <IconClose size="normal" className={css.removeIcon} />
                  </button>
                </div>
                <TimeRange
                  className={css.timeRange}
                  startDate={start}
                  endDate={end}
                  dateType={DATE_TYPE_DATETIME}
                  timeZone={availabilityPlan.timezone}
                />
              </div>
            );
          })}
        </div>
      )}
      {exceptionCount <= MAX_EXCEPTIONS_COUNT ? (
        <InlineTextButton
          className={css.addExceptionButton}
          onClick={() => setIsEditExceptionsModalOpen(true)}
          disabled={disabled}
          ready={ready}
        >
          <FormattedMessage id="AvailabilityPlanExceptions.addException" />
        </InlineTextButton>
      ) : null}
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
            timeZone={availabilityPlan.timezone}
            availabilityExceptions={sortedAvailabilityExceptions}
            updateInProgress={updateInProgress}
            fetchErrors={errors}
            addExceptionInProgress={addExceptionInProgress}
          />
        </Modal>
      ) : null}
    </section>
  );
};

export default AvailabilityPlanExceptions;
