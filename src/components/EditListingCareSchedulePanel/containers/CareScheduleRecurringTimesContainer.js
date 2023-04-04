import React, { useState } from 'react';

import zipcodeToTimezone from 'zipcode-to-timezone';
import { compose } from 'redux';

import { FormattedMessage, injectIntl } from '../../../util/reactIntl';
import {
  InlineTextButton,
  IconEdit,
  Modal,
  CareScheduleExceptions,
  Button,
  WeekPanel,
} from '../..';
import Weekday from '../Weekday';
import { createAvailabilityPlan, createInitialValues } from '../EditListingCareSchedule.helpers';
import { EditListingAvailabilityPlanForm, TimelineForm } from '../../../forms';
import { timestampToDate } from '../../../util/dates';

import css from './containers.module.css';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const REPEAT = 'repeat';

const CareScheduleRecurringTimesContainerComponent = props => {
  const {
    availabilityPlan: savedAvailabilityPlan,
    currentListing,
    disabled,
    errors,
    isPublished,
    onManageDisableScrolling,
    onNextTab,
    onSubmit,
    ready,
    submitButtonText,
    updateInProgress,
    showErrors,
    panelUpdated,
    intl,
    isBooking,
    onChange,
  } = props;

  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);
  const [availabilityExceptions, setAvailabilityExceptions] = useState(
    savedAvailabilityPlan?.availabilityExceptions || []
  );
  const [availabilityPlan, setAvailabilityPlan] = useState(savedAvailabilityPlan);

  const savedStartDate = savedAvailabilityPlan?.startDate;
  const savedEndDate = savedAvailabilityPlan?.endDate;
  const [startDate, setStartDate] = useState(savedStartDate);
  const [endDate, setEndDate] = useState(savedEndDate);

  const handleAvailabilityPlanSubmit = values => {
    setValuesFromLastSubmit(values);

    const newAvailabilityPlan = createAvailabilityPlan(values, currentListing);

    setAvailabilityPlan(newAvailabilityPlan);

    onChange({
      ...newAvailabilityPlan,
      availabilityExceptions,
      startDate,
      endDate,
    });

    setIsEditPlanModalOpen(false);
  };

  const handleSubmit = () => {
    // Final Form can wait for Promises to return.

    if (isBooking) {
      return onSubmit({
        ...availabilityPlan,
        availabilityExceptions,
        startDate,
        endDate,
      });
    }

    return onSubmit({
      publicData: {
        scheduleType: REPEAT,
        availabilityPlan: {
          ...availabilityPlan,
          availabilityExceptions,
          startDate,
          endDate,
        },
      },
    })
      .then(() => {
        if (!isPublished) {
          onNextTab();
        }
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  const initialValues = valuesFromLastSubmit
    ? valuesFromLastSubmit
    : createInitialValues(availabilityPlan);

  const submitDisabled =
    (!valuesFromLastSubmit &&
      startDate === savedStartDate &&
      endDate === savedEndDate &&
      availabilityExceptions === availabilityPlan?.availabilityExceptions) ||
    availabilityPlan?.entries?.length === 0;
  const submitInProgress = updateInProgress;
  const submitReady = ready || panelUpdated;

  const timezone = zipcodeToTimezone.lookup(currentListing.attributes.publicData.location.zipcode);

  const timelineInitialValues = {
    startDate: {
      date: savedStartDate ? timestampToDate(savedStartDate) : null,
    },
    endDate: {
      date: savedEndDate ? timestampToDate(savedEndDate) : null,
    },
  };

  const handleSaveAvailabilityException = exception => {
    setAvailabilityExceptions(prevExceptions => {
      const newExceptions = prevExceptions.concat(exception);

      onChange({
        ...availabilityPlan,
        availabilityExceptions: newExceptions,
        startDate,
        endDate,
      });

      return newExceptions;
    });
  };

  const handleDeleteException = start => {
    setAvailabilityExceptions(prevExceptions => {
      const newExceptions = prevExceptions.filter(
        exception => exception.attributes.start !== start
      );

      onChange({
        ...availabilityPlan,
        availabilityExceptions: newExceptions,
        startDate,
        endDate,
      });

      return newExceptions;
    });
  };

  const onStartDateChange = date => {
    const timeDate = date?.date.getTime();
    setStartDate(timeDate);

    onChange({
      ...availabilityPlan,
      availabilityExceptions,
      startDate: timeDate,
      endDate,
    });
  };

  const onEndDateChange = date => {
    const timeDate = date?.date.getTime();
    setEndDate(timeDate);

    onChange({
      ...availabilityPlan,
      availabilityExceptions,
      startDate,
      endDate: timeDate,
    });
  };

  return (
    <>
      <div className={css.timelineFormContainer}>
        <TimelineForm
          className={css.timelineForm}
          rootClassName={css.timelineForm}
          formId="TimelineForm"
          initialValues={timelineInitialValues}
          intl={intl}
          timeZone={timezone}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
          onSubmit={() => {}}
          keepDirtyOnReinitialize
        />
      </div>
      <section className={css.section}>
        <header className={css.sectionHeader}>
          <h2 className={css.sectionTitle}>
            <FormattedMessage id="CareScheduleRecurringTimesContainer.defaultScheduleTitle" />
          </h2>
          <InlineTextButton
            className={css.editPlanButton}
            onClick={() => setIsEditPlanModalOpen(true)}
          >
            <IconEdit className={css.editPlanIcon} />{' '}
            <FormattedMessage id="CareScheduleRecurringTimesContainer.edit" />
          </InlineTextButton>
        </header>
        <WeekPanel
          availabilityPlan={availabilityPlan}
          openEditModal={() => setIsEditPlanModalOpen(true)}
        />
      </section>
      <div className={css.scheduleExceptionsContainer}>
        <h2 className={css.scheduleExceptionsTitle}>Are there any exceptions to this schedule?</h2>
        <CareScheduleExceptions
          availabilityExceptions={availabilityExceptions}
          onManageDisableScrolling={onManageDisableScrolling}
          availabilityPlan={availabilityPlan}
          updateInProgress={updateInProgress}
          errors={errors}
          disabled={disabled}
          ready={ready}
          listing={currentListing}
          onSave={handleSaveAvailabilityException}
          onDelete={handleDeleteException}
        />
      </div>
      <Button
        className={css.goToNextTabButton}
        onClick={handleSubmit}
        disabled={submitDisabled}
        inProgress={submitInProgress}
        ready={submitReady}
      >
        {submitButtonText}
      </Button>
      {onManageDisableScrolling ? (
        <Modal
          id="EditAvailabilityPlan"
          isOpen={isEditPlanModalOpen}
          onClose={() => setIsEditPlanModalOpen(false)}
          onManageDisableScrolling={onManageDisableScrolling}
          containerClassName={css.modalContainer}
          usePortal
        >
          <EditListingAvailabilityPlanForm
            formId="EditListingAvailabilityPlanForm"
            listingTitle={currentListing.attributes.title}
            availabilityPlan={availabilityPlan}
            weekdays={WEEKDAYS}
            onSubmit={handleAvailabilityPlanSubmit}
            initialValues={initialValues}
            inProgress={updateInProgress}
            fetchErrors={errors}
            showErrors={showErrors}
          />
        </Modal>
      ) : null}
    </>
  );
};

const CareScheduleRecurringTimesContainer = compose(injectIntl)(
  CareScheduleRecurringTimesContainerComponent
);

export default CareScheduleRecurringTimesContainer;
