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
  last4FormatValid,
} from '../../util/validators';
import { Form, Button, FieldTextInput, FieldDateInput, FieldSelect } from '../../components';
import moment from 'moment';

import css from './EditListingBackgroundCheckForm.module.css';
import { useEffect } from 'react';

// Create an array of state abbreviations
const stateAbbreviations = [
  { key: 'AL', label: 'AL' },
  { key: 'AK', label: 'AK' },
  { key: 'AZ', label: 'AZ' },
  { key: 'AR', label: 'AR' },
  { key: 'CA', label: 'CA' },
  { key: 'CO', label: 'CO' },
  { key: 'CT', label: 'CT' },
  { key: 'DE', label: 'DE' },
  { key: 'FL', label: 'FL' },
  { key: 'GA', label: 'GA' },
  { key: 'HI', label: 'HI' },
  { key: 'ID', label: 'ID' },
  { key: 'IL', label: 'IL' },
  { key: 'IN', label: 'IN' },
  { key: 'IA', label: 'IA' },
  { key: 'KS', label: 'KS' },
  { key: 'KY', label: 'KY' },
  { key: 'LA', label: 'LA' },
  { key: 'ME', label: 'ME' },
  { key: 'MD', label: 'MD' },
  { key: 'MA', label: 'MA' },
  { key: 'MI', label: 'MI' },
  { key: 'MN', label: 'MN' },
  { key: 'MS', label: 'MS' },
  { key: 'MO', label: 'MO' },
  { key: 'MT', label: 'MT' },
  { key: 'NE', label: 'NE' },
  { key: 'NV', label: 'NV' },
  { key: 'NH', label: 'NH' },
  { key: 'NJ', label: 'NJ' },
  { key: 'NM', label: 'NM' },
  { key: 'NY', label: 'NY' },
  { key: 'NC', label: 'NC' },
  { key: 'ND', label: 'ND' },
  { key: 'OH', label: 'OH' },
  { key: 'OK', label: 'OK' },
  { key: 'OR', label: 'OR' },
  { key: 'PA', label: 'PA' },
  { key: 'RI', label: 'RI' },
  { key: 'SC', label: 'SC' },
  { key: 'SD', label: 'SD' },
  { key: 'TN', label: 'TN' },
  { key: 'TX', label: 'TX' },
  { key: 'UT', label: 'UT' },
  { key: 'VT', label: 'VT' },
  { key: 'VA', label: 'VA' },
  { key: 'WA', label: 'WA' },
  { key: 'WV', label: 'WV' },
  { key: 'WI', label: 'WI' },
  { key: 'WY', label: 'WY' },
];

const isDayBlocked = day => day.isAfter(moment().subtract(18, 'years'));

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

const formatLast4 = value => {
  // if input value is falsy eg if the user deletes the input, then just return
  if (!value) return value;

  // clean the input for any non-digit values.
  const ssn = value.replace(/[^\d]/g, '');

  // ssnLength is used to know when to apply our formatting for the ssn
  const ssnLength = ssn.length;

  // we need to return the value with no formatting if its less than four digits
  if (ssnLength < 5) return ssn;

  // finally, if the ssnLength is greater then 6, we add the last
  // bit of formatting and return it.
  return `${ssn.slice(0, 4)}`;
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
        authenticateUpdateUserError,
        authenticateUpdateUserInProgress,
        update,
      } = formRenderProps;

      const classes = classNames(css.root, className);
      const submitReady = !!authenticateUserAccessCode;
      const submitInProgress =
        !!authenticateCreateUserInProgress || !!authenticateUpdateUserInProgress;
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

      const last4Formatter = e => {
        // next, we're going to format this input with the `formatSSN` function, which we'll write next.
        const formattedValue = formatLast4(e.currentTarget.value);
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
          <h1 className={css.title}>
            Provide Your <span className={css.identityText}>Information</span>
          </h1>
          {update && (
            <p style={{ color: 'var(--marketplaceColor)' }}>
              We were unable to verify your identity with the information you provided. Please fill
              in your information again. If the issue persists, please contact support.
            </p>
          )}
          <div className={css.row}>
            <FieldTextInput
              id="firstName"
              name="firstName"
              type="text"
              className={css.thirdField}
              label="First Name"
              placeholder="First Name"
              validate={required('First name is required')}
              required
            />
            <FieldTextInput
              id="middleName"
              name="middleName"
              type="text"
              className={css.thirdField}
              label="Middle Name"
              placeholder="Middle Name"
            />
            <FieldTextInput
              id="lastName"
              name="lastName"
              type="text"
              className={css.thirdField}
              label="Last Name"
              placeholder="Last Name"
              validate={required('Last name is required')}
              required
            />
          </div>
          <div className={css.row}>
            <FieldTextInput
              id="addressLine1"
              name="addressLine1"
              disabled={disabled}
              className={css.secondField}
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
              className={css.secondField}
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
              className={css.thirdField}
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
              className={css.thirdField}
              type="text"
              autoComplete="billing address-level2"
              label="City"
              placeholder="City"
              validate={required('City is required')}
              required
            />
            <FieldSelect
              id="state"
              name="state"
              disabled={disabled}
              className={css.thirdField}
              label="State"
              validate={required('State is required')}
              required
            >
              <option disabled value="">
                Select a state
              </option>
              {stateAbbreviations.map(state => (
                <option key={state.key} value={state.key}>
                  {state.label}
                </option>
              ))}
            </FieldSelect>
          </div>
          <div className={update ? css.row : css.ssnRow}>
            <FieldDateInput
              id="dob"
              name="dob"
              className={css.secondField}
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
            {update ? (
              <FieldTextInput
                id="ssn"
                name="ssn"
                type="text"
                className={css.secondField}
                label="SSN"
                placeholder="xxx-xx-xxxx"
                validate={composeValidators(
                  ssnFormatValid('Invalid SSN'),
                  required('SSN is required')
                )}
                onChange={ssnFormatter}
                required
              />
            ) : (
              <div className={css.ssnMain}>
                <div className={css.ssnContainer}>
                  <label>
                    Last 4 of SSN<span className={css.error}>*</span>
                  </label>
                  <div>
                    <input disabled placeholder="••• – •• – " className={css.ssnPlaceholder} />
                  </div>
                  <FieldTextInput
                    className={css.ssn}
                    id="ssn"
                    name="ssn"
                    type="text"
                    placeholder="xxxx"
                    validate={composeValidators(
                      last4FormatValid('Invalid SSN'),
                      required('SSN is required')
                    )}
                    inputRootClass={css.ssnInputRoot}
                    onChange={last4Formatter}
                    required
                  />
                </div>
              </div>
            )}
          </div>
          <div className={css.row}>
            <FieldTextInput
              id="email"
              name="email"
              type="email"
              className={css.secondField}
              label="Email"
              placeholder="example.email@carevine.us"
              validate={composeValidators(
                required('Email is required'),
                emailFormatValid('Invalid email address')
              )}
              required
            />
            <FieldTextInput
              id="phone"
              name="phone"
              type="text"
              className={css.secondField}
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
          {authenticateCreateUserError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingBackgroundCheckForm.authenticateCreateUserError" />
            </p>
          ) : null}
          {authenticateUpdateUserError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingBackgroundCheckForm.authenticateUpdateUserError" />
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
