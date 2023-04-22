import React, { useState, useEffect } from 'react';
import { arrayOf, bool, func, object, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { ensureOwnListing } from '../../util/data';
import { getDefaultTimeZoneOnBrowser, timestampToDate } from '../../util/dates';
import { LISTING_STATE_DRAFT, DATE_TYPE_DATETIME, propTypes } from '../../util/types';
import {
  Button,
  IconClose,
  IconEdit,
  IconSpinner,
  InlineTextButton,
  ListingLink,
  Modal,
  TimeRange,
  CareScheduleExceptions,
  WeekPanel,
} from '../../components';
import Weekday from '../EditListingCareSchedulePanel/Weekday';
import { EditListingAvailabilityPlanForm } from '../../forms';
import AvailabilityTypeForm from './AvailabilityTypeForm';
import {
  createAvailabilityPlan,
  createInitialValues,
} from '../EditListingCareSchedulePanel/EditListingCareSchedule.helpers';

import css from './EditListingAvailabilityPanel.module.css';

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const defaultTimeZone = () =>
  typeof window !== 'undefined' ? getDefaultTimeZoneOnBrowser() : 'America/New_York';

//////////////////////////////////
// EditListingAvailabilityPanel //
//////////////////////////////////
const EditListingAvailabilityPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    fetchExceptionsInProgress,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    disabled,
    ready,
    onSubmit,
    onManageDisableScrolling,
    onNextTab,
    submitButtonText,
    updateInProgress,
    errors,
    panelUpdated,
  } = props;

  const currentListing = ensureOwnListing(listing);
  const defaultAvailabilityPlan = {
    type: 'repeat',
    timezone: defaultTimeZone(),
    entries: [],
  };
  const publicData = currentListing?.attributes?.publicData;
  const savedAvailabilityPlan = publicData?.availabilityPlan;

  const savedAvailabilityExceptions = savedAvailabilityPlan?.availabilityExceptions;
  const savedSelectedAvailabilityTypes = publicData?.scheduleTypes;

  // Hooks
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [valuesFromLastSubmit, setValuesFromLastSubmit] = useState(null);
  const [selectedAvailabilityTypes, setSelectedAvailabilityTypes] = useState(
    savedSelectedAvailabilityTypes || []
  );
  const [availabilityPlan, setAvailabilityPlan] = useState(
    savedAvailabilityPlan || defaultAvailabilityPlan
  );
  const [availabilityExceptions, setAvailabilityExceptions] = useState(
    savedAvailabilityExceptions || []
  );
  const [showNoEntriesError, setShowNoEntriesError] = useState(false);

  const classes = classNames(rootClassName || css.root, className);
  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;

  const submitDisabled =
    selectedAvailabilityTypes.length === 0 ||
    (!valuesFromLastSubmit &&
      selectedAvailabilityTypes === savedSelectedAvailabilityTypes &&
      availabilityExceptions === savedAvailabilityExceptions);
  const submitInProgress = updateInProgress;
  const submitReady = ready || panelUpdated;

  const initialValues = valuesFromLastSubmit
    ? valuesFromLastSubmit
    : createInitialValues(availabilityPlan);

  const handleAvailabilityPlanSubmit = values => {
    setValuesFromLastSubmit(values);
    setShowNoEntriesError(false);

    setAvailabilityPlan(createAvailabilityPlan(values, currentListing));

    setIsEditPlanModalOpen(false);
  };

  const handleSubmit = () => {
    if (selectedAvailabilityTypes.length === 0) {
      return;
    }

    if (availabilityPlan.entries.length === 0) {
      setShowNoEntriesError(true);
      return;
    }

    // Final Form can wait for Promises to return.
    return onSubmit({
      publicData: {
        availabilityPlan: {
          ...availabilityPlan,
          availabilityExceptions,
        },
        scheduleTypes: selectedAvailabilityTypes,
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

  const handleAvailabilityTypeChange = values => {
    // sessionStorage.setItem(, 'value');
    setSelectedAvailabilityTypes(values.scheduleTypes);
  };

  const handleSaveAvailabilityException = exception => {
    setAvailabilityExceptions(prevExceptions => [...prevExceptions, exception]);
  };

  const handleDeleteException = start => {
    setAvailabilityExceptions(prevExceptions =>
      prevExceptions.filter(exception => exception.attributes.start !== start)
    );
  };

  const availabilityTypeFormInitialValues = { scheduleTypes: savedSelectedAvailabilityTypes };

  return (
    <main className={classes}>
      <h1 className={css.title}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingAvailabilityPanel.title"
            values={{
              availability: (
                <span className={css.availabilityText}>
                  <FormattedMessage id="EditListingAvailabilityPanel.availability" />
                </span>
              ),
            }}
          />
        ) : (
          <FormattedMessage
            id="EditListingAvailabilityPanel.createListingTitle"
            values={{
              availability: (
                <span className={css.availabilityText}>
                  <FormattedMessage id="EditListingAvailabilityPanel.availability" />
                </span>
              ),
            }}
          />
        )}
      </h1>

      <AvailabilityTypeForm
        onSubmit={() => {}}
        onChange={handleAvailabilityTypeChange}
        initialValues={availabilityTypeFormInitialValues}
      />

      <section className={css.section}>
        <header className={css.sectionHeader}>
          <h2 className={css.sectionTitle}>
            <FormattedMessage id="EditListingAvailabilityPanel.defaultScheduleTitle" />
          </h2>
          <InlineTextButton
            className={css.editPlanButton}
            onClick={() => setIsEditPlanModalOpen(true)}
          >
            <IconEdit className={css.editPlanIcon} />{' '}
            <FormattedMessage id="EditListingAvailabilityPanel.edit" />
          </InlineTextButton>
        </header>
        <WeekPanel
          availabilityPlan={availabilityPlan}
          openEditModal={() => setIsEditPlanModalOpen(true)}
        />
      </section>
      <div className={css.exceptionsContainer}>
        <h2 className={css.exceptionsTitle}>Are there any exceptions to this schedule?</h2>
        <CareScheduleExceptions
          fetchExceptionsInProgress={fetchExceptionsInProgress}
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
          isCaregiver
        />
      </div>

      {errors.showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
        </p>
      ) : null}
      {errors.updateListingError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.updateListingFailed" />
        </p>
      ) : null}
      {showNoEntriesError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.noEntriesError" />
        </p>
      ) : null}

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
            currentListing={currentListing}
          />
        </Modal>
      ) : null}
    </main>
  );
};

EditListingAvailabilityPanel.defaultProps = {
  className: null,
  rootClassName: null,
  listing: null,
  availabilityExceptions: [],
};

EditListingAvailabilityPanel.propTypes = {
  className: string,
  rootClassName: string,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  availabilityExceptions: arrayOf(propTypes.availabilityException),
  onSubmit: func.isRequired,
  onManageDisableScrolling: func.isRequired,
  onNextTab: func.isRequired,
  submitButtonText: string.isRequired,
  updateInProgress: bool.isRequired,
  errors: object.isRequired,
};

export default EditListingAvailabilityPanel;
