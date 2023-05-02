const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const filePath = path.join(__dirname);

let contacts = [];
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

fs.createReadStream(`${filePath}/out/Oregon_Nursing_Contact_List.csv`)
  .pipe(csv())
  .on('data', async row => {
    contacts.push(row.email);
  })
  .on('end', () => {
    console.log(contacts);
    const msg = {
      from: 'CareVine@carevine.us',
      to: ['peyton.hobson@carevine.us', 'peyton.hobson1@gmail.com', 'peyton.hobson@carevine.us'],
      template_id: 'd-accd3ced34404fdb94aa12e95a35941d',
      category: 'Oregon Nursing',
    };
    sgMail
      .sendMultiple(msg)
      .then(() => {
        console.log('Emails sent successfully');
      })
      .catch(error => {
        console.log(error);
      });
  });
