import React from 'react';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { Form, Button, FieldSelect } from '../../components';

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
              return (
                <div className={css.dateContainer}>
                  <h3 className={css.date}>{monthYearBookingDate}</h3>
                  <div className={css.formRow}>
                    <div className={css.field}>
                      <FieldSelect
                        id={`dateTimes.${monthYearBookingDate}.startTime`}
                        name={`dateTimes.${monthYearBookingDate}.startTime`}
                        selectClassName={css.timeSelect}
                      >
                        {Array.from({ length: 24 }, (v, i) => i).map(i => {
                          const hour = i % 12 || 12;
                          const ampm = i < 12 ? 'am' : 'pm';
                          const time = `${hour}:00 ${ampm}`;
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
                        {Array.from({ length: 24 }, (v, i) => i).map(i => {
                          const hour = (i + 1) % 12 || 12;
                          const ampm = i < 12 || i == 23 ? 'am' : 'pm';
                          const time = `${hour}:00 ${ampm}`;
                          return (
                            <option key={time} value={time}>
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
