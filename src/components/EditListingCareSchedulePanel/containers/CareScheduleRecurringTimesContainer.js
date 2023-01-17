import React, { useState } from 'react';

import { FormattedMessage } from '../../../util/reactIntl';
import { InlineTextButton, IconEdit, Modal, CareScheduleExceptions, Button } from '../..';
import Weekday from '../Weekday';
import { createAvailabilityPlan } from '../EditListingCareSchedule.helpers';
import { EditListingAvailabilityPlanForm } from '../../../forms';

import css from './containers.module.css';

const AVAILABILITY_PLAN_TYPE_RECURRING = 'availability-plan/recurring';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const CareScheduleRecurringTimesContainer = props => {
  const {
    availabilityExceptions,
    availabilityPlan,
    currentListing,
    disabled,
    errors,
    fetchExceptionsInProgress,
    isPublished,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onManageDisableScrolling,
    onNextTab,
    onSubmit,
    ready,
    submitButtonText,
    updateInProgress,
    showErrors,
    useDefaultPlan,
  } = props;

  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);

  const handleSubmit = values => {
    setValuesFromLastSubmit(values);

    const newAvailabilityPlan = createAvailabilityPlan(values, currentListing);

    // Final Form can wait for Promises to return.
    return onSubmit({ publicData: { availabilityPlan: newAvailabilityPlan } })
      .then(() => {
        setIsEditPlanModalOpen(false);
      })
      .catch(e => {
        // Don't close modal if there was an error
      });
  };

  const isNextButtonDisabled = !availabilityPlan;
  const initialValues = valuesFromLastSubmit ? valuesFromLastSubmit : availabilityPlan;

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
        fetchExceptionsInProgress={fetchExceptionsInProgress}
        availabilityExceptions={availabilityExceptions}
        onDeleteAvailabilityException={onDeleteAvailabilityException}
        onAddAvailabilityException={onAddAvailabilityException}
        onManageDisableScrolling={onManageDisableScrolling}
        availabilityPlan={availabilityPlan}
        updateInProgress={updateInProgress}
        errors={errors}
        disabled={disabled}
        ready={ready}
        listing={currentListing}
        useDefaultPlan={useDefaultPlan}
      />
      {!isPublished ? (
        <Button
          className={css.goToNextTabButton}
          onClick={onNextTab}
          disabled={isNextButtonDisabled}
        >
          {submitButtonText}
        </Button>
      ) : null}
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
            onSubmit={handleSubmit}
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
