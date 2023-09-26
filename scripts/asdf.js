const moment = require('moment');

console.log(moment('12:00am', ['h:mm A']).format('HH'));
