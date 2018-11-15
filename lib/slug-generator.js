'use strict';
const _ = require('deepdash')(require('lodash'));

const fs = require('fs');
var getSlug = require('speakingurl'),
  shortId = require('shortid');

module.exports = function(schema, options) {
  options = _.merge(
    {
      separator: '-',
      lang: 'en',
      truncate: 120,
      backwardCompatible: true//will be false in the next major version
    },
    options
  );

  var slugs = [];

  function schemaTraversal(schema, basePath, cb) {
    if (basePath) basePath += '.';
    schema.eachPath(function(schemaPath, schemaType) {
      if (schemaType.caster && schemaType.caster.schema) {
        schemaTraversal(
          schemaType.caster.schema,
          basePath +
            schemaPath +
            (schemaType.constructor.schemaName == 'DocumentArray' ? '.$' : ''),
          cb
        );
      } else {
        cb(basePath + schemaPath, schemaType);
      }
    });
  }
  function renameOldOptions(opts) {
    if(!options.backwardCompatible)
      return opts;
    let res = _.cloneDeep(opts);
    let deprecated = ['unique_slug', 'slug_padding_size'];
    let found = [];
    _.each(deprecated, oldo => {
      if (res[oldo] !== undefined) {
        let newo = _.camelCase(oldo);
        found.push([oldo, newo]);
        res[newo] = res[oldo];
        delete res[oldo];
      }
    });
    if (found.length) {
      console.log(
        'Deprecated "snake_case" options found by slug updater plugin. Please update to camelCase.',
        found
      );
    }
    if(res.uniqueGroup){
      res.uniqueGroupSlug = res.uniqueGroup;
      delete res.uniqueGroup;
      console.log('Deprecated option "uniqueGroup" found by slug updater. Please update to uniqueGroupSlug.')
    }
    if(res.force_id){
      res.forceIdSlug = res.force_id;
      delete res.force_id
      console.log('Deprecated option "force_id" found by slug updater. Please update to forceIdSlug.')
    }
    if(res.on){
      res.slugOn = res.on;
      delete res.on
      console.log('Deprecated option "on" found by slug updater. Please update to slugOn.')
    }
    return res;
  }
  schemaTraversal(schema, '', (schemaPath, schemaType) => {
    if (
      schemaType.instance == 'String' &&
      schemaType.options &&
      schemaType.options.slug
    ) {
      let opts = renameOldOptions(schemaType.options);
      let basePath = schemaPath.replace(/[\.][^\.]+$/, '');
      if (basePath == schemaPath) basePath = '';
      var slug = {
        path: schemaPath,
        basePath,
        on: {
          save: true,
          update: true,
          updateOne: true,
          updateMany: true,
          findOneAndUpdate: true,
          ...(opts.slugOn || {}),
        },
      };

      if (typeof opts.slug === 'string') {
        slug.fields = [opts.slug];
      } else if (opts.slug instanceof Array) {
        slug.fields = opts.slug;
      } else {
        return;
      }
      if (opts.unique || opts.uniqueSlug) {
        slug.unique = true;
      }
      if (opts.permanent) {
        slug.permanent = true;
      }

      if (opts.slugPaddingSize === undefined) {
        slug.isShortIdMode = true;
      } else {
        slug.isShortIdMode = false;
        slug.padding = opts.slugPaddingSize;
      }
      if (opts.uniqueGroupSlug) {
        if (_.isArray(opts.uniqueGroupSlug)) {
          slug.uniqueGroupFields = opts.uniqueGroupSlug;
        } else {
          slug.uniqueGroupFields = [opts.uniqueGroupSlug];
        }
      }
      if (opts.uniqueNestedSlug) {
        slug.uniqueNested = opts.uniqueNestedSlug;
      }
      if (opts.forceIdSlug) {
        slug.unique = true;
        slug.isShortIdMode = true;
        slug.forceShortId = true;
      }
      slugs.push(slug);
    }
  });
  // console.log(slugs);
  schema.pre('update', async function() {
    return onUpdate.bind(this)('update');
  });

  schema.pre('updateOne', async function() {
    return onUpdate.bind(this)('updateOne');
  });

  schema.pre('updateMany', async function() {
    return onUpdate.bind(this)('updateMany');
  });

  schema.pre('findOneAndUpdate', async function() {
    return onUpdate.bind(this)('findOneAndUpdate');
  });

  async function onUpdate(operation) {
    const me = this;
    let upd = me.getUpdate();
    let doc = _.cloneDeep(upd);
    if (doc.$set) {
      _.forOwn(doc.$set, (v, k) => {
        _.set(doc, k, v);
      });
      delete doc.$set;
    }
    let docs = [_.cloneDeep(doc)];

    let unwoundSlugs = unwindSlugs(
      doc,
      _.filter(slugs, `on.${operation}`),
      _.get,
      updIsModified
    );
    if (!unwoundSlugs.length) {
      return;
    }

    let updFields = _.keysDeep(doc);
    let updPaths = _.map(updFields, f =>
      _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.')
    );
    let involvedPaths = _.uniq(
      unwoundSlugs.reduce(
        (acc, slug) => acc.concat(slug.fields).concat([slug.path]),
        []
      )
    ).map(p => p.replace(/^\//, ''));

    let involvedValuesDocs = await me.model[
      operation == 'updateOne' ? 'findOne' : 'find'
    ](
      me.getQuery(),
      _(involvedPaths)
        .map(k => [k.replace(/\.[$\d]+\./g, '.'), 1])
        .fromPairs()
        .value()
    );
    if (involvedValuesDocs) {
      if (!_.isArray(involvedValuesDocs))
        involvedValuesDocs = [involvedValuesDocs];
      involvedValuesDocs.forEach((freshDoc, i) => {
        if (i) docs[i] = _.cloneDeep(doc);
        involvedPaths.forEach(function(f) {
          let fs = unwindPath(freshDoc, f, docGet);
          _.each(fs, f => {
            if (_.get(docs[i], f) === undefined)
              _.set(docs[i], f, _.get(freshDoc, f));
          });
        });
        if (freshDoc && freshDoc._id) docs[i]._id = freshDoc._id;
      });
    }

    let slugsUpd = [];
    async function findOne(query, sort) {
      let res = me.model.findOne(query);
      if (sort) {
        res = res.sort(sort);
      }
      res = await res;
      if (slugsUpd.length && sort) {
        let field = _.first(_.keys(sort));
        let top = _.maxBy(slugsUpd, u => {
          return extractCounter(_.get(u, field), options.separator);
        });
        if (_.has(top, field)) {
          let localCounter = extractCounter(
            _.get(top, field),
            options.separator
          );
          let dbCounter = extractCounter(res.get(field), options.separator);
          if (localCounter > dbCounter) res = top;
        }
      }
      return res;
    }
    for (let i = 0; i < docs.length; i++) {
      let currentUnwoundFields = unwindSlugs(
        docs[i],
        unwoundSlugs,
        _.get,
        updIsModified
      );
      let actualSlugs = currentUnwoundFields;
      if (involvedValuesDocs && involvedValuesDocs.length) {
        let actualUpdFields = _(updFields)
          .filter(f => {
            return _.get(doc, f) != _.get(involvedValuesDocs[i], f);
          })
          .map(f => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
          .value();

        actualSlugs = _.filter(currentUnwoundFields, s => {
          return _.intersection(
            _.map(s.fields.concat(s.uniqueGroupFields || []), p =>
              p.replace(/^\//, '')
            ),
            actualUpdFields
          ).length;
        });
      }
      if (actualSlugs.length) {
        await setSlugs(docs[i], actualSlugs, options, _.get, _.set, findOne);
      }
      slugsUpd[i] = _.cloneDeep(upd.$set || upd);
      actualSlugs.forEach(slug => {
        let slugVal = _.get(docs[i], slug.path);
        if (slugVal != undefined) _.set(slugsUpd[i], slug.path, slugVal);
      });
      if (involvedValuesDocs && involvedValuesDocs.length) {
        _.each(currentUnwoundFields, us => {
          if (_.get(slugsUpd[i], us.path) === undefined) {
            let val = _.get(involvedValuesDocs[i], us.path);
            if (val !== undefined) _.set(slugsUpd[i], us.path, val);
          }
        });
      }

      let doUpd = slugsUpd[i];
      if (upd.$set) {
        let slugPaths = _(slugsUpd[i])
          .indexate({ leafsOnly: true })
          // .mapValues(v=>_.isArray(v)?[]:(_.isObject(v)?{}:v))
          .mapKeys((v, f) => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
          .value();
        doUpd = { $set: slugPaths };
      }

      if (docs.length == 1) {
        if (slugsUpd[i]) me[operation]({}, doUpd);
      } else {
        if (!docs[i]._id)
          throw new Error(
            'Cannot update slug massively, because _id not found for each doc.'
          );
        if (doUpd) {
          await me.model.updateOne({ _id: docs[i]._id }, doUpd);
        }
      }
    }
  }

  schema.pre('save', async function() {
    let doc = this;
    if (!doc.model) {
      return;
    }
    let reSlug = false;
    let unwoundSlugs = unwindSlugs(
      doc,
      _.filter(slugs, 'on.save'),
      docGet,
      docIsModified
    );

    if (!unwoundSlugs.length) {
      return;
    }

    doc = await setSlugs(
      doc,
      unwoundSlugs,
      options,
      docGet,
      docSet,
      async (query, sort) => {
        let res = doc.model(doc.constructor.modelName).findOne(query);
        if (sort) res = res.sort(sort);
        return await res;
      }
    );
  });
};

let docGet = (doc, path) => doc.get(path);
let docSet = (doc, path, val) => doc.set(path, val);
let docIsModified = (doc, path) => doc.isModified(path);

let updIsModified = (upd, path) => _.get(upd, path) !== undefined;

function unwindSlugs(doc, slugs, get, isModified) {
  let unwoundSlugs = [];
  slugs.forEach(slug => {
    let slugPaths = unwindPath(doc, slug.path, get);
    if (!slugPaths.length) slugPaths.push(slug.path);
    let basePath = slug.basePath;

    if (_.endsWith(basePath, '.$')) basePath += '.';
    slugPaths.forEach(slugPath => {
      let unwoundBasePath = slugPath.replace(/\.[^\.]+$/, '');
      if (unwoundBasePath == slugPath) unwoundBasePath = '';
      function unwindFieldPath(fieldPath) {
        let slugValueBasePath = unwoundBasePath;
        let originalBasePath = _.trimEnd(basePath, '.');
        while (_.startsWith(fieldPath, ':')) {
          let prevValueBasePath = slugValueBasePath;
          let prevOriginalBasePath = originalBasePath;
          if (slugValueBasePath.match(/\.[$\d]+$/)) {
            slugValueBasePath = slugValueBasePath.replace(/\.[$\d]+$/, '');
            prevValueBasePath = slugValueBasePath;
          }
          if (originalBasePath.match(/\.[$\d]+$/)) {
            originalBasePath = originalBasePath.replace(/\.[$\d]+$/, '');
            prevOriginalBasePath = originalBasePath;
          }

          slugValueBasePath = slugValueBasePath.replace(/\.[^\.]+$/, '');
          originalBasePath = originalBasePath.replace(/\.[^\.]+$/, '');
          if (slugValueBasePath == prevValueBasePath) slugValueBasePath = '';
          if (originalBasePath == prevOriginalBasePath) originalBasePath = '';
          fieldPath = fieldPath.substr(1);
        }
        if (!_.startsWith(fieldPath, '/')) {
          fieldPath =
            '/' +
            ((slugValueBasePath && slugValueBasePath + '.') || '') +
            fieldPath;
        }
        if (_.startsWith(fieldPath, '/' + originalBasePath))
          fieldPath = fieldPath.replace(
            '/' + originalBasePath,
            '/' + slugValueBasePath
          );
        return fieldPath;
      }
      let unwoundFields = slug.fields.map(unwindFieldPath);
      let unwoundGroupPaths = (slug.uniqueGroupFields || []).map(
        unwindFieldPath
      );
      if (
        _.some(unwoundFields.concat(unwoundGroupPaths), path => {
          return isModified(doc, path.replace(/^\//, ''));
        })
      ) {
        let s = _.cloneDeep(slug);
        s.path = slugPath;
        s.basePath = unwoundBasePath;
        s.fields = unwoundFields;
        s.uniqueGroupFields = unwoundGroupPaths;
        unwoundSlugs.push(s);
      }
    });
  });
  return unwoundSlugs;
}

function unwindPath(doc, path, get, restPathParts) {
  if (restPathParts === undefined) {
    restPathParts = path.split('.$.');
    path = restPathParts[0];
    restPathParts = _.drop(restPathParts);
  }

  let res = [];
  let value = get(doc, path);

  if (_.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      let childPath = path + '.' + i + '.' + restPathParts[0];
      res = res.concat(unwindPath(doc, childPath, get, _.drop(restPathParts)));
    }
  } else {
    if (!restPathParts || !restPathParts.length) res.push(path);
  }
  return res;
}

async function setSlugs(doc, slugs, options, get, set, findOne) {
  await Promise.all(
    slugs.map(async slug => {
      var fields = [];

      slug.fields.forEach(slugField => {
        fields.push(get(doc, slugField.replace(/^\//, '')));
      });
      let oldSlug = get(doc, slug.path);
      if (
        !(slug.unique || slug.uniqueSlug) &&
        (!slug.uniqueGroupFields || !slug.uniqueGroupFields.length)
      ) {
        if (!oldSlug || !slug.permanent) {
          set(doc, slug.path, makeSlug(fields, options));
        }
        return;
      } else {
        var query = {};
        if (slug.uniqueGroupFields) {
          slug.uniqueGroupFields.forEach(function(fieldName) {
            fieldName = fieldName.replace(/^\//, '');
            query[fieldName] = get(doc, fieldName);
          });
        }
        if (!doc[slug.path] || !(slug.permanent && doc[slug.path])) {
          if (slug.isShortIdMode) {
            set(
              doc,
              slug.path,
              await makeUniqueShortIdSlug(
                doc,
                slug.path,
                fields,
                options,
                query,
                findOne,
                get,
                slug.forceShortId
              )
            );
          } else {
            set(
              doc,
              slug.path,
              await makeUniqueCounterSlug(
                doc,
                slug.path,
                fields,
                options,
                slug.padding,
                query,
                findOne
              )
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
function extractCounter(value, separator) {
  let count = 0,
    test = new RegExp(separator + '(\\d+)$'),
    match = null;

  if ((match = value.match(test))) {
    count = match[1];
  }
  return parseInt(count);
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
    search = new RegExp('^' + slug + '(' + options.separator + '(\\d+))?$'),
    sort = {};

  sort[field] = -1;
  if (doc._id) {
    query['_id'] = {
      $ne: doc._id,
    };
  }
  query[field] = search;

  let result = await findOne(query, sort);

  if (result) {
    count = extractCounter(result.get(field), options.separator) + 1;
    slug += options.separator + _.padStart(count, padding, '0');
  }
  return slug;
}

async function makeUniqueShortIdSlug(
  doc,
  field,
  values,
  options,
  query,
  findOne,
  get,
  forceShortId
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
    let oldSlug = get(doc, field);
    if (
      //reuse old slug if possible
      oldSlug &&
      oldSlug.match(new RegExp('^' + slug + options.separator + '.*$'))
    ) {
      // console.log("reuse old random slug",doc[field]);
      slug = oldSlug;
    } else slug += options.separator + shortId.generate();
  } else {
    if (forceShortId) {
      slug += options.separator + shortId.generate();
    }
  }

  return slug;
}
