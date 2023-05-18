const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const filePath = path.join(__dirname);

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `${filePath}/in/Oregon_SW_Filtered_List.csv`,
  header: [
    { id: 'email', title: 'email' },
    { id: 'firstName', title: 'first_name' },
    { id: 'lastName', title: 'last_name' },
    { id: 'licenseType', title: 'license_type' },
    { id: 'county', title: 'county' },
  ],
});

let contacts = [];
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

fs.createReadStream(`${filePath}/in/Oregon_SW_Filtered_List.csv`)
  .pipe(csv())
  .on('data', async row => {
    const vals = Object.values(row);
    const contactOut = {
      email: vals[0],
      firstName:
        row.first_name.substring(0, 1).toUpperCase() + row.first_name.substring(1).toLowerCase(),
      lastName: row.last_name,
      licenseType: row.license_type,
      county: row.county,
    };

    contacts.push(contactOut);
  })
  .on('end', () => {
    const toSend = contacts.slice(0, 99);
    const remainingContacts = contacts.slice(99);

    const contactEmails = toSend
      .map(c => ({
        to: c.email,
        dynamic_template_data: { firstName: c.firstName },
      }))
      .concat({ to: 'peyton.hobson@carevine.us', dynamic_template_data: { firstName: 'Peyton' } });

    const msg = {
      from: 'CareVine@carevine-mail.com',
      template_id: 'd-37d0014938e1419696e36d8de11ce9f8',
      category: 'SW Promo',
      asm: {
        group_id: 42912,
      },
      personalizations: contactEmails,
    };

    sgMail
      .sendMultiple(msg)
      .then(() => {
        csvWriter
          .writeRecords(remainingContacts)
          .then(() => console.log('The CSV file was written successfully'));
        console.log('Emails sent successfully');
      })
      .catch(error => {
        console.log(error?.response?.body?.errors);
      });
  });
