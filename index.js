if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dist/three-map.min.js');
} else {
    module.exports = require('./dist/three-map.js');
}
