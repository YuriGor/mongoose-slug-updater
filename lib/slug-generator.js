'use strict';
const fs = require('fs');
var getSlug = require('speakingurl'),
  shortId = require('shortid');

module.exports = function(schema, options) {
  var watcher = [],
    slugs = [],
    opts = {
      separator: '-',
      lang: 'en',
      truncate: 120,
    };

  //merge de options
  for (var attrname in options) {
    opts[attrname] = options[attrname];
  }

  schema.eachPath(function(pathname, schemaType) {
    if (
      schemaType.instance == 'String' &&
      schemaType.options &&
      schemaType.options.slug
    ) {
      var slug = {
        name: pathname,
        on: {
          save: true,
          update: true,
          updateOne: true,
          updateMany: true,
          ...(schemaType.options.on||{})
        },
      };

      if (typeof schemaType.options.slug === 'string') {
        slug.values = [schemaType.options.slug];
      } else if (schemaType.options.slug instanceof Array) {
        slug.values = schemaType.options.slug;
      } else {
        return;
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
      if (schemaType.options.uniqueGroup) {
        if (schemaType.options.uniqueGroup instanceof Array) {
          slug.uniqueGroup = schemaType.options.uniqueGroup;
        } else {
          slug.uniqueGroup = [schemaType.options.uniqueGroup];
        }
      }

      watcher = watcher.concat(
        slug.values.filter(function(item) {
          return watcher.indexOf(item) < 0;
        })
      );
      if (slug.uniqueGroup)
        watcher = watcher.concat(
          slug.uniqueGroup.filter(function(item) {
            return watcher.indexOf(item) < 0;
          })
        );

      slugs.push(slug);
    }
  });

  /**
   * Executed before update value
   */

  schema.pre('update', async function() {
    return onUpdate.bind(this)('update');
  });

  schema.pre('updateOne', async function() {
    return onUpdate.bind(this)('updateOne');
  });

  schema.pre('updateMany', async function() {
    return onUpdate.bind(this)('updateMany');
  });

  async function onUpdate(operation) {
    const me = this;
    // console.debug('preupdate!', me.getQuery(), me.getUpdate());
    let upd = me.getUpdate();
    // console.debug('preupdateOne before',me.getQuery(), upd);
    let docs = [{ ...(upd.$set || upd) }];
    // console.log("doc",doc);
    let updFields = Object.keys(docs[0]);

    if (!updFields.filter(value => -1 !== watcher.indexOf(value)).length) {
      // console.log('no slug update needed', updFields, watcher);
      return;
    }
    let affectedSlugs = slugs.filter(
      slug =>
        slug.on[operation] &&
        (slug.values.filter(slugValue => updFields.indexOf(slugValue) !== -1)
          .length ||
          (slug.uniqueGroup &&
            slug.uniqueGroup.filter(
              slugValue => updFields.indexOf(slugValue) !== -1
            ).length))
    );
    if (!affectedSlugs.length) return;
    // console.log("affectedSlugs",affectedSlugs);
    let missingFields = affectedSlugs
      .reduce((acc, slug) => acc.concat(slug.values).concat([slug.name]), [])
      .filter(val => updFields.indexOf(val) == -1);
    // console.log("missingFields",missingFields);
    if (missingFields.length) {
      // console.log('some fields are missing ', missingFields);
      // console.debug('preupdateOne middle',me.getQuery(), me.getUpdate());
      let missingValuesDocs = await me.model[
        operation == 'updateOne' ? 'findOne' : 'find'
      ](me.getQuery(), missingFields.join(' '));
      // if(!missingValuesDocs){
      //   console.log("cannot "+(operation == 'updateOne' ? 'findOne ' : 'find ')+' missing fields ',missingFields,me.getQuery(),missingValuesDocs);
      // }
      if (!Array.isArray(missingValuesDocs))
        missingValuesDocs = [missingValuesDocs];
      missingValuesDocs.forEach((missingValuesDoc, i) => {
        if (i) docs[i] = { ...docs[0] };
        missingFields.forEach(function(f) {
          if(missingValuesDoc)
            docs[i][f] = missingValuesDoc[f];
        });
        if (missingValuesDoc&&missingValuesDoc._id) docs[i]._id = missingValuesDoc._id;
      });
    } else {
      let query = me.getQuery();
      if (query._id) docs[0]._id = query._id;
      else {
        let missingValuesDocs = await await me.model[
          operation == 'updateOne' ? 'findOne' : 'find'
        ](me.getQuery(), '_id');
        if (!Array.isArray(missingValuesDocs))
          missingValuesDocs = [missingValuesDocs];
        missingValuesDocs.forEach((missingValuesDoc, i) => {
          if (i) docs[i] = { ...docs[0] };
          if (missingValuesDoc._id) docs[i]._id = missingValuesDoc._id;
        });
      }
    }
    function findOne(query) {
      return me.model.findOne(query);
    }
    let slugsUpd = [];
    let different = false;
    for (let i = 0; i < docs.length; i++) {
      await setSlugs(docs[i], affectedSlugs, opts, findOne);
      // console.log("after setSlugs",docs[i]);
      slugsUpd[i] = {};
      affectedSlugs.forEach(slug => {
        if (docs[i][slug.name]) slugsUpd[i][slug.name] = docs[i][slug.name];
      });
      if (upd.$set) slugsUpd[i] = { $set: slugsUpd[i] };

      if (docs.length == 1) me[operation]({}, slugsUpd[i]);
      else {
        if (!docs[i]._id)
          throw new Error(
            'Cannot update slug massively, because _id not found for each doc.'
          );
        await me.model.updateOne({ _id: docs[i]._id }, slugsUpd[i]);
      }
    }
  }

  /**
   * Executed before save value
   */
  schema.pre('save', async function() {
    var doc = this,
      reSlug = false;

    let updFields = [];
    watcher.forEach(function(field) {
      if (doc.isModified(field)) {
        reSlug = true;
        updFields.push(field);
      }
    });

    if (!reSlug) {
      // console.log('no slug generation needed');
      return;
    }
    let affectedSlugs = slugs.filter(
      slug =>
        slug.on.save &&
        (slug.values.filter(slugValue => updFields.indexOf(slugValue) !== -1)
          .length ||
          (slug.uniqueGroup &&
            slug.uniqueGroup.filter(
              slugValue => updFields.indexOf(slugValue) !== -1
            ).length))
    );
    if (!affectedSlugs.length) return;

    doc = await setSlugs(doc, affectedSlugs, opts, query => {
      return doc.model(doc.constructor.modelName).findOne(query);
    });
  });
};

async function setSlugs(doc, slugs, opts, findOne) {
  // console.log("setSlugs",doc,slugs);
  await Promise.all(
    slugs.map(async item => {
      var values = [];

      item.values.forEach(function(item) {
        values.push(doc[item]);
      });

      if (!(item.unique || item.unique_slug) && !item.uniqueGroup) {
        if (!doc[item.name] || !(item.permanent && doc[item.name])) {
          doc[item.name] = makeSlug(values, opts);
        }
        // console.log('not unique slug generated');
        return;
      } else {
        var query = {};
        if (item.uniqueGroup) {
          item.uniqueGroup.forEach(function(fieldName) {
            query[fieldName] = doc[fieldName];
          });
          // console.log('group query', query);
        }
        if (!doc[item.name] || !(item.permanent && doc[item.name])) {
          if (item.isShortIdMode) {
            doc[item.name] = await makeUniqueShortIdSlug(
              doc,
              item.name,
              values,
              opts,
              query,
              findOne
            );
            // console.log(item.name,doc[item.name]);
          } else {
            doc[item.name] = await makeUniqueCounterSlug(
              doc,
              item.name,
              values,
              opts,
              item.padding,
              query,
              findOne
            );
          }
        }
      }
    })
  );
  return doc;
}

function makeSlug(values, options) {
  var slug = getSlug(values.join(' '), options);

  return slug;
}

async function makeUniqueCounterSlug(
  doc,
  field,
  values,
  options,
  padding,
  query,
  findOne
) {
  var slug = makeSlug(values, options),
    count = 0,
    match = null,
    test = new RegExp(options.separator + '(\\d+)$'),
    search = new RegExp('^' + slug + '(' + options.separator + '(\\d+))?$'),
    sort = {};

  sort[field] = -1;
  // console.log("counter slug query before",query);
  if (doc._id) {
    query['_id'] = {
      $ne: doc._id,
    };
  }
  query[field] = search;
  // console.log("counter slug query after",query);

  // field = search and doc != doc
  let result = await findOne(query).sort(sort);
  if (result) {
    // console.log("counter slug check", result);
    if ((match = result[field].match(test))) {
      count = match[1];
    }
    count++;
    slug += options.separator + pad(count, padding);
    // console.log("slug counter inc",slug);
  }
  return slug;
}

function pad(num, size) {
  var s = num + '';
  while (s.length < size) s = '0' + s;
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
 */
async function makeUniqueShortIdSlug(
  doc,
  field,
  values,
  options,
  query,
  findOne
) {
  var slug = makeSlug(values, options);

  query[field] = slug;

  if (doc._id) {
    query['_id'] = {
      $ne: doc._id,
    };
  }

  let result = await findOne(query);
  if (result) {
    // console.log('doc already exists', result[field], doc[field],slug);
    if (
      //reuse old slug if possible
      doc[field] &&
      doc[field].match(new RegExp('^' + slug + options.separator + '.*$'))
    ) {
      // console.log("reuse old random slug",doc[field]);
      slug = doc[field];
    } else slug += options.separator + shortId.generate();
  }

  return slug;
}
