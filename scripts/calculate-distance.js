const { point, distance } = require('@turf/turf');

const options = { units: 'miles' };
const point1 = point([-105.47629, 40.37978]);
const point2 = point([-105.47629, 40.813487767706114]);
console.log(Number.parseFloat(distance(point1, point2, options)).toFixed(2));
