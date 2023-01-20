import React, { useState } from 'react';

import { FormattedMessage } from '../../../util/reactIntl';
import { InlineTextButton, IconEdit, Modal, CareScheduleExceptions, Button } from '../..';
import Weekday from '../Weekday';
import { createAvailabilityPlan, createInitialValues } from '../EditListingCareSchedule.helpers';
import { EditListingAvailabilityPlanForm } from '../../../forms';

import css from './containers.module.css';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const CareScheduleRecurringTimesContainer = props => {
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
  } = props;

  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);
  const [availabilityExceptions, setAvailabilityExceptions] = useState(
    (savedAvailabilityPlan && savedAvailabilityPlan.availabilityExceptions) || []
  );
  const [availabilityPlan, setAvailabilityPlan] = useState(savedAvailabilityPlan);

  const handleAvailabilityPlanSubmit = values => {
    setValuesFromLastSubmit(values);

    setAvailabilityPlan(createAvailabilityPlan(values, currentListing));

    setIsEditPlanModalOpen(false);
  };

  const handleSubmit = () => {
    // Final Form can wait for Promises to return.
    return onSubmit({
      publicData: {
        availabilityPlan: {
          ...availabilityPlan,
          availabilityExceptions,
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

  const submitDisabled = !valuesFromLastSubmit;
  const submitInProgress = updateInProgress;
  const submitReady = ready || panelUpdated;

  const handleSaveAvailabilityException = exception => {
    setAvailabilityExceptions(prevExceptions => [...prevExceptions, exception]);
  };

  const handleDeleteException = start => {
    setAvailabilityExceptions(prevExceptions =>
      prevExceptions.filter(exception => exception.attributes.start !== start)
    );
  };

  return (
    <>
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
        <div className={css.week}>
          {WEEKDAYS.map(w => (
            <Weekday
              dayOfWeek={w}
              key={w}
              availabilityPlan={availabilityPlan}
              openEditModal={setIsEditPlanModalOpen}
            />
          ))}
        </div>
      </section>
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

export default CareScheduleRecurringTimesContainer;
