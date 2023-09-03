import React, { useState } from 'react';
import { bool, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { Form, DailyPlan, Button, FieldCheckboxGroup } from '../../components';
import { findOptionsForSelectFilter } from '../../util/search';
import config from '../../config';
import { required } from '../../util/validators';

import css from './EditListingAvailabilityPlanForm.module.css';

const filterConfig = config.custom.filters;

const startTimeOrderMap = new Map([
  ['12:00am', 0],
  ['1:00am', 1],
  ['2:00am', 2],
  ['3:00am', 3],
  ['4:00am', 4],
  ['5:00am', 5],
  ['6:00am', 6],
  ['7:00am', 7],
  ['8:00am', 8],
  ['9:00am', 9],
  ['10:00am', 10],
  ['11:00am', 11],
  ['12:00pm', 12],
  ['1:00pm', 13],
  ['2:00pm', 14],
  ['3:00pm', 15],
  ['4:00pm', 16],
  ['5:00pm', 17],
  ['6:00pm', 18],
  ['7:00pm', 19],
  ['8:00pm', 20],
  ['9:00pm', 21],
  ['10:00pm', 22],
  ['11:00pm', 23],
]);

const sortEntries = (defaultCompareReturn = 0) => (a, b) => {
  if (a.startTime && b.startTime) {
    const aStart = startTimeOrderMap.get(a.startTime);
    const bStart = startTimeOrderMap.get(b.startTime);
    return aStart - bStart;
  }
  return defaultCompareReturn;
};

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
          rootClassName,
          showErrors,
          values,
          weekdays,
          ready,
          updated,
          hideScheduleTypes,
          onChange,
          hideSubmit,
          submitButtonText,
        } = fieldRenderProps;

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;

        const { updateListingError } = fetchErrors || {};

        const submitDisabled = submitInProgress;
        const submitReady = updated || ready;

        const checkboxLabel = intl.formatMessage({ id: 'AvailabilityTypeForm.checkboxLabel' });

        const typeOptions = findOptionsForSelectFilter('scheduleTypes', filterConfig);

        return (
          <Form id={formId} className={classes} onSubmit={handleSubmit}>
            <FormSpy
              onChange={e => {
                if (onChange) {
                  onChange(e.values);
                }
              }}
            />
            {!hideScheduleTypes ? (
              <FieldCheckboxGroup
                className={css.features}
                id="scheduleTypes"
                name="scheduleTypes"
                options={typeOptions}
                label={checkboxLabel}
                required
                inline
                validate={required('Please select at least one schedule type.')}
              />
            ) : null}
            <h2 className={css.heading}>
              <FormattedMessage id="EditListingAvailabilityPlanForm.title" />
            </h2>
            <div className={css.week}>
              {weekdays.map(w => {
                return (
                  <DailyPlan
                    dayOfWeek={w}
                    key={w}
                    values={values}
                    intl={intl}
                    className={css.dailyPlan}
                  />
                );
              })}
            </div>

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
            {!hideSubmit ? (
              <Button
                type="submit"
                inProgress={submitInProgress}
                disabled={submitDisabled}
                className={css.submitButton}
                ready={submitReady}
              >
                {submitButtonText || (
                  <FormattedMessage id="EditListingAvailabilityPlanForm.saveSchedule" />
                )}
              </Button>
            ) : null}
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
