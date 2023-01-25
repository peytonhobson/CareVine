import React from 'react';

import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { minLength, maxLength, required, composeValidators } from '../../util/validators';
import { Form, Button, FieldTextInput, FieldDateInput } from '../../components';
import moment from 'moment';

import css from './EditListingBackgroundCheckForm.module.css';
import { useEffect } from 'react';

const isDayBlocked = day => {
  const isBlocked = day.isAfter(moment().subtract(18, 'years'));
  return isBlocked;
};

const EditListingBackgroundCheckForm = props => (
  <FinalForm
    {...props}
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
        fetchErrors,
      } = formRenderProps;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const renderMonthElement = ({ month, onMonthSelect, onYearSelect }) => {
        let i;
        let years = [];
        for (i = moment().year() - 18; i >= moment().year() - 100; i--) {
          years.push(
            <option value={i} key={`year-${i}`}>
              {i}
            </option>
          );
        }

        return (
          <div className={css.monthYearContainer}>
            <select
              value={month.month()}
              onChange={e => onMonthSelect(month, e.target.value)}
              className={css.monthSelect}
            >
              {moment.months().map((label, value) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={month.year()}
              onChange={e => onYearSelect(month, e.target.value)}
              className={css.yearSelect}
            >
              {years}
            </select>
          </div>
        );
      };

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <div className={css.row}>
            <FieldTextInput
              id="firstName"
              name="firstName"
              type="text"
              className={css.nameInput}
              label="First Name"
              placeholder="First Name"
              validate={required('First name is required')}
            />
            <FieldTextInput
              id="middleName"
              name="middleName"
              type="text"
              className={css.nameInput}
              label="Middle Name"
              placeholder="Middle Name"
            />
            <FieldTextInput
              id="lastName"
              name="lastName"
              type="text"
              className={css.nameInput}
              label="Last Name"
              placeholder="Last Name"
              validate={required('Last name is required')}
            />
          </div>
          <div className={css.row}>
            <FieldTextInput
              id="email"
              name="email"
              type="email"
              className={css.emailInput}
              label="Email"
              placeholder="example.email@carevine.us"
              validate={required('Email is required')}
            />
            <FieldTextInput
              id="phone"
              name="phone"
              type="phone"
              className={css.phoneInput}
              label="Phone Number"
              placeholder="(xxx) xxx-xxxx"
              validate={required('Phone is required')}
            />
          </div>
          <div className={css.row}>
            <FieldTextInput
              id="addressLine1"
              name="addressLine1"
              disabled={disabled}
              className={css.streetField}
              type="text"
              autoComplete="billing address-line1"
              label="Street Address"
              placeholder="123 Example Street"
              validate={required('Street address is required')}
            />

            <FieldTextInput
              id="addressLine2"
              name="addressLine2"
              disabled={disabled}
              className={css.aptField}
              type="text"
              autoComplete="billing address-line2"
              label="Apt # • optional"
              placeholder="A 42"
            />
          </div>
          <div className={css.row}>
            <FieldDateInput
              id="dob"
              name="dob"
              className={css.dobInput}
              label="Date of Birth"
              placeholderText="mm/dd/yyyy"
              validate={required('Date of Birth is required')}
              renderMonthElement={renderMonthElement}
              isDayBlocked={isDayBlocked}
              isOutsideRange={isDayBlocked}
              initialVisibleMonth={() => moment().subtract(18, 'years')}
            />
          </div>

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingBackgroundCheckForm;
