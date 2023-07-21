import React, { useState } from 'react';
import { bool, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { Form, PrimaryButton, DailyPlan } from '../../components';

import css from './EditListingAvailabilityPlanForm.module.css';

const submit = (onSubmit, weekdays, values) => {
  const sortedValues = weekdays.reduce(
    (submitValues, day) => {
      return submitValues[day]
        ? {
            ...submitValues,
            [day]: submitValues[day].sort(sortEntries()),
          }
        : submitValues;
    },
    { ...values }
  );

  onSubmit(sortedValues);
};

const EditListingAvailabilityPlanFormComponent = props => {
  const { onSubmit, ...restOfprops } = props;
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [showUnfinishedError, setShowUnfinishedError] = useState(false);
  return (
    <FinalForm
      {...restOfprops}
      onSubmit={values => {
        const concatDayEntriesReducer = (entries, day) => {
          return values[day] ? entries.concat(values[day]) : entries;
        };

        const hasUnfinishedEntries = !!props.weekdays
          .reduce(concatDayEntriesReducer, [])
          .find(e => !e.startTime || !e.endTime);

        const entryValues = props.weekdays.reduce((entries, day) => {
          return values[day] ? entries.concat(values[day]) : entries;
        }, []);

        if (hasUnfinishedEntries) {
          setShowUnfinishedError(true);
          return;
        }

        if (entryValues.length === 0) {
          setShowEmptyError(true);
          return;
        }

        setShowEmptyError(false);
        setShowUnfinishedError(false);

        submit(onSubmit, props.weekdays, values);
      }}
      mutators={{
        ...arrayMutators,
      }}
      render={fieldRenderProps => {
        const {
          className,
          fetchErrors,
          formId,
          handleSubmit,
          inProgress,
          intl,
          listingTitle,
          rootClassName,
          showErrors,
          values,
          weekdays,
          currentListing,
        } = fieldRenderProps;

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;

        const { updateListingError } = fetchErrors || {};

        const submitDisabled = submitInProgress;

        return (
          <Form id={formId} className={classes} onSubmit={handleSubmit}>
            <h2 className={css.heading}>
              <FormattedMessage id="EditListingAvailabilityPlanForm.title" />
            </h2>
            <div className={css.week}>
              {weekdays.map(w => {
                return <DailyPlan dayOfWeek={w} key={w} values={values} intl={intl} />;
              })}
            </div>

            <div className={css.submitButton}>
              {updateListingError && showErrors ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingAvailabilityPlanForm.updateFailed" />
                </p>
              ) : null}
              {showEmptyError ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingAvailabilityPlanForm.emptyError" />
                </p>
              ) : null}
              {showUnfinishedError ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingAvailabilityPlanForm.unfinishedError" />
                </p>
              ) : null}
              <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
                <FormattedMessage id="EditListingAvailabilityPlanForm.saveSchedule" />
              </PrimaryButton>
            </div>
          </Form>
        );
      }}
    />
  );
};

EditListingAvailabilityPlanFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  submitButtonWrapperClassName: null,
  inProgress: false,
};

EditListingAvailabilityPlanFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  submitButtonWrapperClassName: string,

  inProgress: bool,
  fetchErrors: object.isRequired,

  listingTitle: string.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const EditListingAvailabilityPlanForm = compose(injectIntl)(
  EditListingAvailabilityPlanFormComponent
);

EditListingAvailabilityPlanForm.displayName = 'EditListingAvailabilityPlanForm';

export default EditListingAvailabilityPlanForm;
