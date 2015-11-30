'use strict';

module.exports = function (schema, options) {

};

/* TODO
 - Search the schema in order to find slugs options
 - For each slug options, save the slug in order to options values  (could be an string or array)
 - For each slug options, search if unique option is set,
 - If unique option is set, search for one with the slug or slug-{1,3} ordered by string
 - Take the -{1,3} value and add 1 more.
 - If value plus 1 is more than 999, then add a second -{1,3}
 */

/* TODO test
 - Check every method individually.
 */