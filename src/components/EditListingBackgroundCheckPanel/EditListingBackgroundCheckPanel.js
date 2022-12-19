import React, { useEffect } from 'react';
import classNames from 'classnames';
import { Button } from '../';
import { ensureOwnListing } from '../../util/data';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { FormattedMessage } from 'react-intl';

import css from './EditListingBackgroundCheckPanel.module.css';

const isDev = process.env.REACT_APP_ENV === 'development';

const EditListingBackgroundCheckPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    onChange,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;

  useEffect(() => {
    const script = document.createElement('script');

    script.src = `https://cdn${isDev ? '-dev' : ''}.authenticating.com/public/verifyUI/client.js`;
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const { description, title, publicData } = currentListing.attributes;

  const isPublished = currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
  const panelTitle = <FormattedMessage id="EditListingBackgroundCheckPanel.createListingTitle" />;

  // const userFullName = listing?.author?.attributes.profile.displayName;

  return (
    <div className={classes}>
      <h1 className={css.title}>{panelTitle}</h1>
      <Button
        onClick={() =>
          identify('COMPANY_ACCESS_CODE', {
            email: 'johndoe@email.com',
            firstName: 'John',
            middleName: 'Smith',
            lastName: 'Doe',
            dob: '11-02-1976',
            verificationOption: 'EITHER',
            redirectURL: 'https://www.authenticating.com',
          })
        }
      >
        Verify
      </Button>
    </div>
  );
};

export default EditListingBackgroundCheckPanel;
