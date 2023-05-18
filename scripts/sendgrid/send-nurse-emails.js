const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const filePath = path.join(__dirname);

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: `${filePath}/out/Oregon_CNA_Contact_List_Remaining.csv`,
  header: [
    { id: 'email', title: 'email' },
    { id: 'firstName', title: 'first_name' },
    { id: 'lastName', title: 'last_name' },
    { id: 'licenseType', title: 'license_type' },
    { id: 'county', title: 'county' },
  ],
});

let contacts = [];
sgMail.setApiKey(process.env.SENDGRID_PROMO_KEY);

fs.createReadStream(`${filePath}/out/Oregon_CNA_Contact_List_Remaining.csv`)
  .pipe(csv())
  .on('data', async row => {
    const contactOut = {
      email: row['email'],
      firstName:
        row.first_name.substring(0, 1).toUpperCase() + row.first_name.substring(1).toLowerCase(),
      lastName: row.last_name,
      licenseType: row.license_type,
      county: row.county,
    };

    contacts.push(contactOut);
  })
  .on('end', () => {
    const toSend = contacts.slice(0, 200);
    const remainingContacts = contacts.slice(200);

    const contactEmails = toSend.map(c => ({
      to: c.email,
      dynamic_template_data: { firstName: c.firstName },
    }));

    console.log(contacts.length);
    console.log(remainingContacts.length);

    const msg = {
      from: 'CareVine@carevine-mail.com',
      template_id: 'd-030af6b376cf499da60b037b588c7833',
      category: 'CNA Promo',
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
