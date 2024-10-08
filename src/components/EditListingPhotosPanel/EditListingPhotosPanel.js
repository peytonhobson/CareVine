import React, { Component } from 'react';
import { array, bool, func, object, string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { LISTING_STATE_DRAFT } from '../../util/types';
import { EditListingPhotosForm } from '../../forms';
import { ensureOwnListing } from '../../util/data';
import { ListingLink } from '../../components';

import css from './EditListingPhotosPanel.module.css';

class EditListingPhotosPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAvatar: props.currentUser.attributes.profile.publicData?.defaultAvatar,
    };
  }

  render() {
    const {
      className,
      rootClassName,
      errors,
      disabled,
      ready,
      listing,
      onImageUpload,
      onUpdateImageOrder,
      submitButtonText,
      panelUpdated,
      updateInProgress,
      onChange,
      onSubmit,
      onRemoveImage,
      profileImage,
      currentUser,
      onProfileImageUpload,
      uploadInProgress,
      image,
      onUpdateProfile,
      isNewListingFlow,
      onManageDisableScrolling,
    } = this.props;

    const rootClass = rootClassName || css.root;
    const classes = classNames(rootClass, className);
    const currentListing = ensureOwnListing(listing);

    const isPublished =
      currentListing.id && currentListing.attributes.state !== LISTING_STATE_DRAFT;
    const panelTitle = isPublished ? (
      <FormattedMessage
        id="EditListingPhotosPanel.title"
        values={{
          profilePicture: (
            <span className={css.profilePictureText}>
              <FormattedMessage id="EditListingPhotosPanel.profilePicture" />
            </span>
          ),
        }}
      />
    ) : (
      <FormattedMessage
        id="EditListingPhotosPanel.createListingTitle"
        values={{
          profilePicture: (
            <span className={css.profilePictureText}>
              <FormattedMessage id="EditListingPhotosPanel.profilePicture" />
            </span>
          ),
        }}
      />
    );

    return (
      <div className={classes}>
        <h1 className={css.title}>{panelTitle}</h1>
        <EditListingPhotosForm
          className={css.form}
          disabled={disabled}
          ready={ready}
          fetchErrors={errors}
          initialValues={{ profileImage, selectedAvatar: this.state.selectedAvatar }}
          onImageUpload={onImageUpload}
          onManageDisableScrolling={onManageDisableScrolling}
          onSubmit={values => {
            //Need to add upload image

            const uploadedImage = image;

            // Update profileImage only if file system has been accessed
            const updatedValues = !values.selectedAvatar
              ? {
                  profileImageId: uploadedImage?.imageId,
                  publicData: { defaultAvatar: null },
                }
              : {
                  profileImageId: null,
                  publicData: { defaultAvatar: values.selectedAvatar },
                };

            onUpdateProfile(updatedValues);

            const updateValues = !values.selectedAvatar
              ? {
                  publicData: {
                    profileImageId: values.profileImage.id,
                  },
                }
              : null;

            onSubmit(updateValues);
          }}
          onChange={onChange}
          onChangeAvatar={value => this.setState({ selectedAvatar: value })}
          onUpdateImageOrder={onUpdateImageOrder}
          onRemoveImage={onRemoveImage}
          saveActionMsg={submitButtonText}
          updated={panelUpdated}
          updateInProgress={updateInProgress}
          profileImage={profileImage}
          selectedAvatar={this.state.selectedAvatar}
          currentUser={currentUser}
          onProfileImageUpload={onProfileImageUpload}
          uploadInProgress={uploadInProgress}
          image={image}
          isNewListingFlow={isNewListingFlow}
          initialValuesEqual={() => true}
        />
      </div>
    );
  }
}

EditListingPhotosPanel.defaultProps = {
  className: null,
  rootClassName: null,
  errors: null,
  images: [],
  listing: null,
};

EditListingPhotosPanel.propTypes = {
  className: string,
  rootClassName: string,
  errors: object,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  images: array,

  // We cannot use propTypes.listing since the listing might be a draft.
  listing: object,

  onSubmit: func.isRequired,
  onChange: func.isRequired,
  submitButtonText: string.isRequired,
  panelUpdated: bool.isRequired,
  updateInProgress: bool.isRequired,
  profileImage: object,
};

export default EditListingPhotosPanel;
