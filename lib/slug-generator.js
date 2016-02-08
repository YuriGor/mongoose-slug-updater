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

            if (schemaType.options.slug_padding_size === undefined) {
                slug.isShortIdMode = true;
            } else {
                slug.isShortIdMode = false;
                slug.padding = schemaType.options.slug_padding_size;
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

            if (!(item.unique || item.unique_slug)) {
                doc[item.name] = makeSlug(values, opts);
                callback();
            } else {
                if (item.isShortIdMode) {
                    makeUniqueShortIdSlug(doc, item.name, values, opts, function (err, slug) {
                        doc[item.name] = slug;
                        callback();
                    })
                } else {
                    makeUniqueCounterSlug(doc, item.name, values, opts, item.padding , function (err, slug) {
                        doc[item.name] = slug;
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


function makeUniqueCounterSlug(doc, field, values, options, padding, next) {

    var slug = makeSlug(values, options),
        count = 0,
        match = null,
        test = new RegExp(options.separator + '(\\d+)$'),
        query = {},
        search = new RegExp(slug + "(" + options.separator + '(\\d+))?$'),
        sort = {};

    sort[field] = -1;

    if (doc._id) {
        query["_id"] = {
            $ne: doc._id
        }
    }

    query[field] = search;

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
 * @param next
 */
function makeUniqueShortIdSlug(doc, field, values, options, next) {

    var slug = makeSlug(values, options),
        query = {};

    query[field] = slug;

    doc.model(doc.constructor.modelName).findOne(query).exec(function (err, result) {
        if (result) {
            slug += options.separator + shortId.generate();
        }

        next(null, slug);
    });
}