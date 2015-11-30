'use strict';

var getSlug = require('speakingurl'),
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

            if (schemaType.options.unique) {
                slug.unique = true;
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

            if (!item.unique) {
                doc[item.name] = makeSlug(values, opts);
                callback();
            } else {
                makeUniqueSlug(doc, item.name, values, opts, function (err, slug) {
                    doc[item.name] = slug;
                    callback();
                })
            }

        }, function (err, res) {
            console.log(doc);
            next();
        });

    });


    /**
     * Executed before save value
     */
    schema.pre('save', function (next) {
        var doc = this;
        console.log("\n\nand this?", doc, "\n\n\n");
        next();
    });


};


function makeSlug(values, options) {

    var slug = getSlug(
        values.join(" "),
        options
    );

    return slug;
}


function makeUniqueSlug(doc, field, values, options, next) {

    var slug = makeSlug(values, options),
        count = 0,
        match = null,
        test = new RegExp(options.separator + '(\\d+)$'),
        query = [],
        sort = {};

    sort[field] = -1;


    doc.model(doc.constructor.modelName).findOne(query).sort(sort).exec(function (err, result) {

        if (result) {
            if (match = result[field].match(test)) {
                count = match[1];
            }

            count++;
            slug += options.separator + count;
        }

        next(null, slug);

    })


}

/* TODO
 - Search the schema in order to find slugs options
 - For each slug options, save the slug in order to options values  (could be an string or array)
 - For each slug options, search if unique option is set,
 - If unique option is set, search for one with the slug or slug-{1,3} ordered by string
 */

/* TODO test
 - Check every method individually.
 */