import React from 'react';

import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import { intlShape, injectIntl, FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import {
  minLength,
  maxLength,
  required,
  composeValidators,
  emailFormatValid,
  phoneFormatValid,
  postalCodeFormatValid,
  ssnFormatValid,
} from '../../util/validators';
import { Form, Button, FieldTextInput, FieldDateInput } from '../../components';
import moment from 'moment';

import css from './EditListingBackgroundCheckForm.module.css';
import { useEffect } from 'react';

const isDayBlocked = day => {
  const isBlocked = day.isAfter(moment().subtract(18, 'years'));
  return isBlocked;
};

const formatSSN = value => {
  // if input value is falsy eg if the user deletes the input, then just return
  if (!value) return value;

  // clean the input for any non-digit values.
  const ssn = value.replace(/[^\d]/g, '');

  // ssnLength is used to know when to apply our formatting for the ssn
  const ssnLength = ssn.length;

  // we need to return the value with no formatting if its less than four digits
  if (ssnLength < 4) return ssn;

  // if ssnLength is greater than 4 and less the 6 we start to return
  // the formatted number
  if (ssnLength < 6) {
    return `${ssn.slice(0, 3)}-${ssn.slice(3)}`;
  }

  // finally, if the ssnLength is greater then 6, we add the last
  // bit of formatting and return it.
  return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5, 9)}`;
};

const formatPhoneNumber = value => {
  // if input value is falsy eg if the user deletes the input, then just return
  if (!value) return value;

  // clean the input for any non-digit values.
  const ssn = value.replace(/[^\d]/g, '');

  // ssnLength is used to know when to apply our formatting for the ssn
  const ssnLength = ssn.length;

  // we need to return the value with no formatting if its less than four digits
  if (ssnLength < 4) return ssn;

  // if ssnLength is greater than 4 and less the 6 we start to return
  // the formatted number
  if (ssnLength < 7) {
    return `${ssn.slice(0, 3)}-${ssn.slice(3)}`;
  }

  // finally, if the ssnLength is greater then 6, we add the last
  // bit of formatting and return it.
  return `${ssn.slice(0, 3)}-${ssn.slice(3, 6)}-${ssn.slice(6, 10)}`;
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
        form,
        authenticateCreateUserError,
        authenticateCreateUserInProgress,
        authenticateUserAccessCode,
      } = formRenderProps;

      const classes = classNames(css.root, className);
      const submitReady = !!authenticateUserAccessCode;
      const submitInProgress = !!authenticateCreateUserInProgress;
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

      const ssnFormatter = e => {
        // next, we're going to format this input with the `formatSSN` function, which we'll write next.
        const formattedValue = formatSSN(e.currentTarget.value);
        // Then we'll set the value of the inputField to the formattedValue we generated with the formatSSN function
        form.change('ssn', formattedValue);
      };

      const phoneFormatter = e => {
        // next, we're going to format this input with the `formatSSN` function, which we'll write next.
        const formattedValue = formatPhoneNumber(e.currentTarget.value);
        // Then we'll set the value of the inputField to the formattedValue we generated with the formatSSN function
        form.change('phone', formattedValue);
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
              required
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
              required
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
              validate={composeValidators(
                required('Email is required'),
                emailFormatValid('Invalid email address')
              )}
              required
            />
            {/* Make sure to replace dashes with empty and add +1 */}
            <FieldTextInput
              id="phone"
              name="phone"
              type="text"
              className={css.phoneInput}
              label="Phone Number"
              placeholder="xxx-xxx-xxxx"
              validate={composeValidators(
                phoneFormatValid('Invalid phone number'),
                required('Phone is required')
              )}
              onChange={phoneFormatter}
              required
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
              displayFormat="MM/DD/YYYY"
              required
            />
            {/* Need to parse out - */}
            <FieldTextInput
              id="ssn"
              name="ssn"
              type="text"
              className={css.aptField}
              label="SSN"
              placeholder="xxx-xx-xxxx"
              validate={composeValidators(
                ssnFormatValid('Invalid SSN'),
                required('SSN is required')
              )}
              onChange={ssnFormatter}
              required
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
              required
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
            <FieldTextInput
              id="zipCode"
              name="zipCode"
              disabled={disabled}
              className={css.nameInput}
              type="text"
              autoComplete="billing postal-code"
              label="Zip Code"
              placeholder="12345"
              validate={composeValidators(
                postalCodeFormatValid('Invalid postal code'),
                required('Postal code is required')
              )}
              required
            />
            <FieldTextInput
              id="city"
              name="city"
              disabled={disabled}
              className={css.nameInput}
              type="text"
              autoComplete="billing address-level2"
              label="City"
              placeholder="City"
              validate={required('City is required')}
              required
            />
            <FieldTextInput
              id="state"
              name="state"
              disabled={disabled}
              className={css.nameInput}
              type="text"
              autoComplete="billing address-level1"
              label="State"
              placeholder="State"
              required
            />
          </div>

          {authenticateCreateUserError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingBackgroundCheckForm.authenticateCreateUserError" />
            </p>
          ) : null}

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
