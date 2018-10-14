'use strict';

var getSlug = require('speakingurl'),
    shortId  = require('shortid'),
    async = require('async');

module.exports = function (schema, options) {
    var watcher = [],
        slugs = [],
        opts = {
            separator: "-",
            lang: "en",
            truncate: 120
        };

    //merge de options
    for (var attrname in options) {
        opts[attrname] = options[attrname];
    }


    schema.eachPath(function (pathname, schemaType) {
        if (schemaType.instance == "String" && schemaType.options && schemaType.options.slug) {

            var slug = {
                "name": pathname
            };

            if (typeof(schemaType.options.slug) === "string") {
                slug.values = [schemaType.options.slug]
            } else if (schemaType.options.slug instanceof Array) {
                slug.values = schemaType.options.slug
            } else {
                //TODO launch error
            }

            if (schemaType.options.unique || schemaType.options.unique_slug) {
                slug.unique = true;
            }
            if (schemaType.options.permanent) {
                slug.permanent = true;
            }

            if (schemaType.options.slug_padding_size === undefined) {
                slug.isShortIdMode = true;
            } else {
                slug.isShortIdMode = false;
                slug.padding = schemaType.options.slug_padding_size;
            }
            if(schemaType.options.uniqueGroup) {
                if (schemaType.options.uniqueGroup instanceof Array) {
                    slug.uniqueGroup = schemaType.options.uniqueGroup;
                } else {
                    slug.uniqueGroup = [schemaType.options.uniqueGroup];
                }
            }

            watcher = watcher.concat(slug.values.filter(function (item) {
                return watcher.indexOf(item) < 0;
            }));
            slugs.push(slug);

        }
    });


    /**
     * Executed before save value
     */
    schema.pre('save', function (next) {
        var doc = this,
            reSlug = false;

        watcher.forEach(function (item) {
            if (doc.isModified(item)) {
                reSlug = true;
            }
        });

        if (!reSlug) {
            return next();
        }

        async.each(slugs, function (item, callback) {
            var values = [];

            item.values.forEach(function (item) {
                values.push(doc[item]);
            });

            if (!(item.unique || item.unique_slug) && !(item.uniqueGroup)) {
                if (!doc[item.name] || !(item.permanent && doc[item.name])) {
                    doc[item.name] = makeSlug(values, opts);
                }
                callback();
            } else {
                var query = {};
                if (item.uniqueGroup) {
                    item.uniqueGroup.forEach(function(fieldName) {
                        query[fieldName] = doc[fieldName];
                    });
                }
                if (item.isShortIdMode) {
                    makeUniqueShortIdSlug(doc, item.name, values, opts, query, function (err, slug) {
                        if (!doc[item.name] || !(item.permanent && doc[item.name])) {
                            doc[item.name] = slug;
                        }
                        callback();
                    });
                } else {
                    makeUniqueCounterSlug(doc, item.name, values, opts, item.padding, query, function (err, slug) {
                        if (!doc[item.name] || !(item.permanent && doc[item.name])) {
                            doc[item.name] = slug;
                        }
                        callback();
                    })
                }

            }

        }, function (err, res) {
            next();
        });

    });


};


function makeSlug(values, options) {

    var slug = getSlug(
        values.join(" "),
        options
    );

    return slug;
}


function makeUniqueCounterSlug(doc, field, values, options, padding, query, next) {

    var slug = makeSlug(values, options),
        count = 0,
        match = null,
        test = new RegExp(options.separator + '(\\d+)$'),
        search = new RegExp('^' + slug + "(" + options.separator + '(\\d+))?$'),
        sort = {};

    sort[field] = -1;

    if (doc._id) {
        query["_id"] = {
            $ne: doc._id
        }
    }
    query[field] = search;

    //console.log(query);
    // field = search and doc != doc
    doc.model(doc.constructor.modelName).findOne(query).sort(sort).exec(function (err, result) {
        if (result) {
            if (match = result[field].match(test)) {
                count = match[1];
            }
            count++;
            slug += options.separator + pad(count, padding);
        }

        next(null, slug);

    })

}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

/***
 * Generates a unique slug. If the slug is already used, the generated slug has an appended random string, eg: my-slug-NJw9XvZ5l
 *
 * @param doc
 * @param field
 * @param values
 * @param options
 * @param query
 * @param next
 */
function makeUniqueShortIdSlug(doc, field, values, options, query, next) {

    var slug = makeSlug(values, options);

    query[field] = slug;

    if (doc._id) {
        query["_id"] = {
            $ne: doc._id
        }
    }

    doc.model(doc.constructor.modelName).findOne(query).exec(function (err, result) {
        if (result) {
            slug += options.separator + shortId.generate();
        }

        next(null, slug);
    });
}
