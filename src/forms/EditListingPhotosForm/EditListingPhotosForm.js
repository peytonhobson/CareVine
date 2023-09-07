import React, { Component } from 'react';
import { array, bool, func, shape, string, object } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, Field } from 'react-final-form';
import { FormattedMessage, intlShape, injectIntl } from '../../util/reactIntl';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { nonEmptyArray, composeValidators, requiredChecked } from '../../util/validators';
import { isUploadImageOverLimitError } from '../../util/errors';
import {
  Button,
  Form,
  ValidationError,
  IconSpinner,
  Avatar,
  ImageFromFile,
  FieldCheckbox,
  NamedLink,
  InlineTextButton,
} from '../../components';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

import css from './EditListingPhotosForm.module.css';

const ACCEPT_IMAGES = 'image/*';
const UPLOAD_CHANGE_DELAY = 2000; // Show spinner so that browser has time to load img srcset

export class EditListingPhotosFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { uploadDelay: false, previewImage: null };
    this.submittedImage = null;
    this.uploadDelayTimeoutId = null;
    this.cropperRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    // Upload delay is additional time window where Avatar is added to the DOM,
    // but not yet visible (time to load image URL from srcset)
    if (prevProps.uploadInProgress && !this.props.uploadInProgress) {
      this.setState({ uploadDelay: true });
      this.uploadDelayTimeoutId = window.setTimeout(() => {
        this.setState({ uploadDelay: false });
      }, UPLOAD_CHANGE_DELAY);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.uploadDelayTimeoutId);
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        render={formRenderProps => {
          const {
            form,
            className,
            fetchErrors,
            handleSubmit,
            uploadInProgress,
            intl,
            invalid,
            pristine,
            disabled,
            ready,
            saveActionMsg,
            updated,
            updateInProgress,
            profileImage,
            currentUser,
            onProfileImageUpload,
            image,
            isNewListingFlow,
            onChangeAvatar,
            selectedAvatar,
          } = formRenderProps;

          const { publishListingError, showListingsError, updateListingError, uploadImageError } =
            fetchErrors || {};
          const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);

          let uploadImageFailed = null;

          if (uploadOverLimit) {
            uploadImageFailed = (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadOverLimit" />
              </p>
            );
          } else if (uploadImageError) {
            uploadImageFailed = (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
              </p>
            );
          }

          // NOTE: These error messages are here since Photos panel is the last visible panel
          // before creating a new listing. If that order is changed, these should be changed too.
          // Create and show listing errors are shown above submit button
          const publishListingFailed = publishListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
            </p>
          ) : null;
          const showListingFailed = showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
            </p>
          ) : null;

          // imgs can contain added images (with temp ids) and submitted images with uniq ids.

          const submitReady = ((updated && pristine) || ready) && !publishListingFailed;
          const submitInProgress = updateInProgress;
          const submitDisabled =
            invalid ||
            disabled ||
            submitInProgress ||
            uploadInProgress ||
            ready ||
            (image === null && !selectedAvatar);

          const classes = classNames(css.root, className);

          const uploadingOverlay =
            uploadInProgress || this.state.uploadDelay ? (
              <div className={css.uploadingImageOverlay}>
                <IconSpinner />
              </div>
            ) : null;

          const hasUploadError = !!uploadImageError && !uploadInProgress;
          const errorClasses = classNames({ [css.avatarUploadError]: hasUploadError });
          const transientUserProfileImage =
            this.cropperRef.current?.src || currentUser.profileImage;
          const transientUser = { ...currentUser, profileImage: transientUserProfileImage };

          // Ensure that file exists if imageFromFile is used
          const fileExists = this.cropperRef.current?.src;
          const fileuploadInProgress = uploadInProgress && fileExists;
          const delayAfterUpload = profileImage.imageId && this.state.uploadDelay;
          const imageFromFile =
            fileExists && (fileuploadInProgress || delayAfterUpload) ? (
              <ImageFromFile
                id={profileImage.id}
                className={errorClasses}
                rootClassName={css.uploadingImage}
                aspectRatioClassName={css.squareAspectRatio}
                file={this.cropperRef.current?.src}
              >
                {uploadingOverlay}
              </ImageFromFile>
            ) : null;

          // Avatar is rendered in hidden during the upload delay
          // Upload delay smoothes image change process:
          // responsive img has time to load srcset stuff before it is shown to user.
          const avatarClasses = classNames(errorClasses, css.avatar, {
            [css.avatarInvisible]: this.state.uploadDelay,
          });
          const avatarComponent =
            !fileuploadInProgress && profileImage.imageId ? (
              <Avatar
                className={avatarClasses}
                renderSizes="(max-width: 767px) 96px, 240px"
                user={transientUser}
                disableProfileLink
              />
            ) : null;

          const chooseAvatarLabel =
            this.state.previewImage || fileuploadInProgress ? (
              <div className={css.avatarContainer}>
                {imageFromFile}
                {avatarComponent}
                <div className={css.changeAvatar}>
                  <FormattedMessage id="ProfileSettingsForm.changeAvatar" />
                </div>
              </div>
            ) : (
              <div className={css.avatarPlaceholder}>
                <div className={css.avatarPlaceholderText}>
                  <FormattedMessage id="ProfileSettingsForm.addYourProfilePicture" />
                </div>
                <div className={css.avatarPlaceholderTextMobile}>
                  <FormattedMessage id="ProfileSettingsForm.addYourProfilePictureMobile" />
                </div>
              </div>
            );

          const AvatarButton = props => {
            const { currentUser, name, selectedAvatar, children } = props;

            return (
              <button
                className={classNames(css.avatarButton, selectedAvatar === name && css.selected)}
                type="button"
                onClick={() => handleChangedAvatar(name)}
              >
                {children || (
                  <Avatar
                    className={css.defaultAvatar}
                    user={{
                      ...currentUser,
                      profileImage: null,
                      attributes: {
                        ...currentUser.attributes,
                        profile: {
                          ...currentUser.attributes.profile,
                          publicData: { defaultAvatar: name },
                        },
                      },
                    }}
                    disableProfileLink
                  />
                )}
              </button>
            );
          };

          const DefaultAvatar = props => {
            const { color, currentUser } = props;

            return (
              <div className={css.colorAvatarWrapper}>
                <Avatar
                  className={css.colorAvatar}
                  initialsClassName={css.colorAvatarInitials}
                  user={{
                    ...currentUser,
                    profileImage: null,
                    attributes: {
                      ...currentUser.attributes,
                      profile: {
                        ...currentUser.attributes.profile,
                        publicData: { defaultAvatar: color },
                      },
                    },
                  }}
                  disableProfileLink
                />
              </div>
            );
          };

          const handleChangedAvatar = avatarColor => {
            form.change('selectedAvatar', avatarColor);
            onChangeAvatar(avatarColor);
          };

          let mainAvatar = null;

          if (selectedAvatar) {
            mainAvatar = <DefaultAvatar color={selectedAvatar} currentUser={currentUser} />;
          } else {
            mainAvatar = (
              <Field
                accept={ACCEPT_IMAGES}
                id="profileImage"
                name="profileImage"
                label={chooseAvatarLabel}
                type="file"
                form={null}
                uploadImageError={uploadImageError}
                disabled={uploadInProgress}
              >
                {fieldProps => {
                  const { accept, id, input, label, disabled, uploadImageError } = fieldProps;
                  const { name, type } = input;
                  const onChange = e => {
                    e.preventDefault();
                    let files;
                    if (e.dataTransfer) {
                      files = e.dataTransfer.files;
                    } else if (e.target) {
                      files = e.target.files;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      this.setState({ previewImage: reader.result });
                    };
                    reader.readAsDataURL(files[0]);
                  };

                  let error = null;

                  if (isUploadImageOverLimitError(uploadImageError)) {
                    error = (
                      <div className={css.error}>
                        <FormattedMessage id="ProfileSettingsForm.imageUploadFailedFileTooLarge" />
                      </div>
                    );
                  } else if (uploadImageError) {
                    error = (
                      <div className={css.error}>
                        <FormattedMessage id="ProfileSettingsForm.imageUploadFailed" />
                      </div>
                    );
                  }

                  const onCrop = () => {
                    const cropper = this.cropperRef.current?.cropper;
                    console.log(cropper.getCroppedCanvas().toDataURL());
                  };

                  return (
                    <div className={css.uploadAvatarWrapper}>
                      {this.state.previewImage ? (
                        <>
                          <Cropper
                            className={css.cropper}
                            src={this.state.previewImage}
                            initialAspectRatio={1}
                            zoomTo={0.25}
                            viewMode={1}
                            minCropBoxHeight={10}
                            minCropBoxWidth={10}
                            background={false}
                            responsive={true}
                            autoCropArea={1}
                            checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
                            guides={true}
                            cropBoxResizable={false}
                            ref={this.cropperRef}
                            preview=".img-preview"
                          />
                          <div className={classNames(css.imgPreview, 'img-preview')}></div>
                        </>
                      ) : (
                        <label className={css.label} htmlFor={id}>
                          {label}
                        </label>
                      )}

                      <input
                        accept={accept}
                        id={id}
                        name={name}
                        className={css.uploadAvatarInput}
                        disabled={disabled}
                        onChange={onChange}
                        type={type}
                      />
                      {error}
                    </div>
                  );
                }}
              </Field>
            );
          }

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedImage = profileImage;
                handleSubmit(e);
              }}
            >
              <div className={css.sectionContainer}>
                <h3 className={css.sectionTitle}>
                  <FormattedMessage id="ProfileSettingsForm.yourProfilePicture" />
                </h3>
                <div className={css.avatarsContainer}>
                  {mainAvatar}
                  <div className={css.defaultProfiles}>
                    <AvatarButton currentUser={currentUser} selectedAvatar={selectedAvatar}>
                      <div className={classNames(css.avatarPlaceholder, css.defaultAvatar)}>+</div>
                    </AvatarButton>
                    <AvatarButton
                      name="1"
                      currentUser={currentUser}
                      selectedAvatar={selectedAvatar}
                    />
                    <AvatarButton
                      name="2"
                      currentUser={currentUser}
                      selectedAvatar={selectedAvatar}
                    />
                    <AvatarButton
                      name="3"
                      currentUser={currentUser}
                      selectedAvatar={selectedAvatar}
                    />
                    <AvatarButton
                      name="4"
                      currentUser={currentUser}
                      selectedAvatar={selectedAvatar}
                    />
                  </div>
                </div>
                {!selectedAvatar ? (
                  <>
                    <div className={css.tip}>
                      <FormattedMessage id="ProfileSettingsForm.tip" />
                    </div>
                    <div className={css.fileInfo}>
                      <FormattedMessage id="ProfileSettingsForm.fileInfo" />
                    </div>
                  </>
                ) : null}
              </div>

              {updateListingError ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingPhotosForm.updateFailed" />
                </p>
              ) : null}
              {publishListingFailed}
              {showListingFailed}

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
  }
}

EditListingPhotosFormComponent.defaultProps = { fetchErrors: null, images: [] };

EditListingPhotosFormComponent.propTypes = {
  fetchErrors: shape({
    publishListingError: propTypes.error,
    showListingsError: propTypes.error,
    uploadImageError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  images: array,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  profileImage: object,
};

export default compose(injectIntl)(EditListingPhotosFormComponent);
