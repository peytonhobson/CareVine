import React from 'react';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { Form, Button, FieldSelect } from '../../components';
import { convertTimeFrom12to24 } from '../../util/data';

import css from './EditBookingForm.module.css';

const EditBookingFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        monthYearBookingDates,
        onChange,
        values,
      } = formRenderProps;

      const classes = classNames(css.root, className);
      const submitInProgress = updateInProgress;
      const submitReady = (updated && pristine) || ready;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FormSpy onChange={onChange} />
          <div className={css.datesContainer}>
            {monthYearBookingDates.map(monthYearBookingDate => {
              const startTimeValue = values.dateTimes?.[monthYearBookingDate]?.startTime;
              const endTimeValue = values.dateTimes?.[monthYearBookingDate]?.endTime;
              const integerStartTimeVal = startTimeValue
                ? Number.parseInt(convertTimeFrom12to24(startTimeValue).split(':')[0])
                : null;
              const integerEndTimeVal = endTimeValue
                ? Number.parseInt(convertTimeFrom12to24(endTimeValue).split(':')[0])
                : 0;

              return (
                <div className={css.dateContainer}>
                  <h3 className={css.date}>{monthYearBookingDate}</h3>
                  <div className={css.formRow}>
                    <div className={css.field}>
                      <FieldSelect
                        id={`dateTimes.${monthYearBookingDate}.startTime`}
                        name={`dateTimes.${monthYearBookingDate}.startTime`}
                        selectClassName={css.timeSelect}
                        initialValueSelected={monthYearBookingDate.startTime}
                      >
                        <option disabled value="">
                          8:00am
                        </option>
                        {Array.from(
                          { length: integerEndTimeVal ? integerEndTimeVal : 24 },
                          (v, i) => i
                        ).map(i => {
                          const hour = i % 12 || 12;
                          const ampm = i < 12 ? 'am' : 'pm';
                          const time = `${hour}:00${ampm}`;
                          return (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </FieldSelect>
                    </div>
                    <span className={css.dashBetweenTimes}>-</span>
                    <div className={css.field}>
                      <FieldSelect
                        id={`dateTimes.${monthYearBookingDate}.endTime`}
                        name={`dateTimes.${monthYearBookingDate}.endTime`}
                        selectClassName={css.timeSelect}
                      >
                        <option disabled value="">
                          5:00pm
                        </option>
                        {Array.from({ length: 24 - integerStartTimeVal }, (v, i) => i).map(i => {
                          const hour = (i + integerStartTimeVal + 1) % 12 || 12;
                          const ampm =
                            i + integerStartTimeVal + 1 < 12 || i + integerStartTimeVal === 23
                              ? 'am'
                              : 'pm';
                          const time = `${hour}:00${ampm}`;
                          return (
                            <option key={i + 25} value={time}>
                              {time}
                            </option>
                          );
                        })}
                      </FieldSelect>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Form>
      );
    }}
  />
);

export default compose(injectIntl)(EditBookingFormComponent);
