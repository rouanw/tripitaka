const { format } = require('util');
const { get } = require('dot-prop');

module.exports = function(params = {}) {
  const { template = '%o [%s] %s', paths = ['ctx.timestamp', 'level', 'message'] } = params;
  return (record) => {
    const values = paths.map(path => {return get(record, path);});
    return format(template, ...values);
  };
};