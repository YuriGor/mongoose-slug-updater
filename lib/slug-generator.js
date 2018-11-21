'use strict';
const _ = require('deepdash')(require('lodash'));

const fs = require('fs');
var getSlug = require('speakingurl'),
  shortId = require('shortid');

module.exports = function plugin(schema, options) {
  options = _.merge(
    {
      separator: '-',
      lang: 'en',
      truncate: 120,
      backwardCompatible: true,
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
    if (!options.backwardCompatible) return opts;
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
    if (res.uniqueGroup) {
      res.uniqueGroupSlug = res.uniqueGroup;
      delete res.uniqueGroup;
      console.log(
        'Deprecated option "uniqueGroup" found by slug updater. Please update to uniqueGroupSlug.'
      );
    }
    if (res.force_id) {
      res.forceIdSlug = res.force_id;
      delete res.force_id;
      console.log(
        'Deprecated option "force_id" found by slug updater. Please update to forceIdSlug.'
      );
    }
    if (res.on) {
      res.slugOn = res.on;
      delete res.on;
      console.log(
        'Deprecated option "on" found by slug updater. Please update to slugOn.'
      );
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
        console.warn(`slug option expected to be string or array. ${typeof opts.slug} found and will be ignored.`);
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
    // console.log(` = ${operation} ${me.model.modelName} = \n`);
    let upd = me.getUpdate();
    let doc = _.cloneDeep(upd);
    if (doc.$set) {
      _.forOwn(doc.$set, (v, k) => {
        _.set(doc, k, v);
      });
      delete doc.$set;
    }
    let docs = [_.cloneDeep(doc)];

    let unwoundSlugs = unwindSlugs(doc, _.filter(slugs, `on.${operation}`));
    if (!unwoundSlugs.length) {
      return;
    }

    let updFields = _.keysDeep(doc);
    // let updPaths = _.map(updFields, f =>
    //   _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.')
    // );
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
          let fs = unwindPath(freshDoc, f);
          _.each(fs, f => {
            if (_.get(docs[i], f) === undefined)
              _.set(docs[i], f, _.get(freshDoc, f));
          });
        });
        if (freshDoc && freshDoc._id) docs[i]._id = freshDoc._id;
      });
    }

    let slugsUpd = [];
    let cache = {};
    async function findOne(query, sort) {
      let res = me.model.findOne(query);
      if (sort) {
        res = res.sort(sort);
      }
      // res = await res;
      // if (slugsUpd.length && sort) {
      //   let field = _.first(_.keys(sort));
      //   let top = _.maxBy(slugsUpd, u => {
      //     return extractCounter(_.get(u, field), options.separator);
      //   });
      //   if (_.has(top, field)) {
      //     let localCounter = extractCounter(
      //       _.get(top, field),
      //       options.separator
      //     );
      //     let dbCounter = extractCounter(res.get(field), options.separator);
      //     if (localCounter > dbCounter) res = top;
      //   }
      // }
      return res;
    }
    for (let i = 0; i < docs.length; i++) {
      let currentUnwoundFields = unwindSlugs(docs[i], unwoundSlugs);
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
        await setSlugs(docs[i], actualSlugs, options, findOne, cache);
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
          .omitBy(v=>v===undefined)
          .value();
        doUpd = { $set: slugPaths };
      }

      if (docs.length == 1) {
        if (slugsUpd[i]) me[operation]({}, doUpd);
      } else {
        // Mongoose doesn't support docs without _id
        // if (!docs[i]._id)
        //   throw new Error(
        //     'Cannot update slug massively, because _id not found for each doc.'
        //   );
        if (doUpd) {
          await me.model.updateOne({ _id: docs[i]._id }, doUpd);
        }
      }
    }
    // console.log(me.getUpdate());
  }
  schema.pre('save', async function() {
    let cache = {};
    let doc = this;
    if (!doc.model) {
      return;
    }
    // console.log(` = save ${doc.constructor.modelName} = \n`);
    // console.log(doc);
    let reSlug = false;
    let unwoundSlugs = unwindSlugs(doc, _.filter(slugs, 'on.save'));

    if (!unwoundSlugs.length) {
      return;
    }

    doc = await setSlugs(
      doc,
      unwoundSlugs,
      options,
      async (query, sort) => {
        let res = doc.model(doc.constructor.modelName).findOne(query);
        if (sort) res = res.sort(sort);
        return res;
      },
      cache
    );
    // console.log(doc);
  });
};
function updateUpdCache(cache, path, slug, value) {
  // console.log(`updateUpdCache ${path}: ${slug}`);
  let maskedPath = path.replace(/\.[$\d]+\./g, '.$.');
  let isArrayPath = path != maskedPath;
  if (isArrayPath) {
    let localKey = maskedPath + ':' + slug;
    // console.log(`${path} resolves ${cache.upd[localKey].ext.path} with ${value}  \n${localKey}`);
    cache.lock[path].ext.resolveEx(value);
    delete cache.lock[path];
  }
}
async function findSame(
  cache,
  doc,
  group,
  path,
  slug,
  isCounter,
  options,
  findOne,
  //slugsMdfPaths
) {
  // console.log(`findSame#${doc.n} ${path}: ${slug}`);
  // console.log(cache);
  cache = _.merge(cache, { db: {}, unwind: {}, upd: {}, lock:{} });
  // console.log(cache);
  let maskedPath = path.replace(/\.[$\d]+\./g, '.$.');
  let isArrayPath = path != maskedPath;
  let slugRx = new RegExp(
    '^' +
      slug +
      '(' +
      options.separator +
      (isCounter ? '(\\d+)' : '(.+)') +
      ')?$'
  );
  let localKey = maskedPath + ':' + slug;
  // console.log(`findSame#${doc.n} localKey: \n${localKey}`);
  let key = localKey + '-' + JSON.stringify(group);
  // let candidates = [];
  if (isArrayPath) {
    // console.log('array? maskedPath', maskedPath);
    let ext = { path };
    let updPromise = new Promise((resolve, reject) => {
      ext.resolveEx = resolve;
      ext.rejectEx = reject;
    });
    updPromise.ext = ext;
    if (cache.upd[localKey] !== undefined) {
      let res = cache.upd[localKey];
      // console.log(`${path} put lock \n${localKey}`);
      cache.upd[localKey] = updPromise;
      let fromPath = res.ext.path;
      cache.lock[path] = updPromise;
      // console.log(`${path} waits for ${fromPath} \n${localKey}`);
      res = await res;
      // console.log(`${path} got ${fromPath}  \n${localKey}`,res);
      return res;
    } else {
      // console.log(`${path} put lock init \n${localKey}`);
      cache.upd[localKey] = updPromise;
      cache.lock[path] = updPromise;
    }
//     if (cache.unwind[maskedPath] === undefined) {
//       cache.unwind[maskedPath] = {
//         list: _(unwindPath(doc, maskedPath))
//           .map(p => [p, docGet(doc, p)])
//           .filter(([p, v]) => v !== undefined && slugsMdfPaths[p] === undefined)
//           .sortBy('[1]')
//           .value(),
//       };
//     }
// 
//     let top = _(cache.unwind[maskedPath].list)
//       .filter(([p, v]) => p != path && v.match(slugRx))
//       .last();
//     if (top) {
//       // console.log(`unwind cache for ${path}: ${top[1]}`);
//       candidates.push(top[1]);
//     } else {
//       console.log(`no unwind cache for ${path}: `,cache.unwind[maskedPath].list);
//     }
  }
  let query = _.cloneDeep(group);
  let sort = {};
  if (cache.db[key] === undefined) {
    let arrayPath = path.replace(/\.[$\d]+\./g, '.');
    query[arrayPath] = slugRx;
    if (doc._id) {
      if(query['_id']==undefined){
        query['_id'] = {
          $ne: doc._id,
        };
      }else{
        query=false;
      }
    }
    if(query!==false){
      if (isCounter) sort[arrayPath] = -1;
      cache.db[key] = findOne(query, sort);
    }else{
      cache.db[key] = null;
    }
  }
  if (_.isObject(cache.db[key]) && _.isFunction(cache.db[key].then)) {
    let foundDoc = await cache.db[key];
    if (_.isObject(cache.db[key]) && _.isFunction(cache.db[key].then)) {
      if (!foundDoc) {
        // console.log('db cache set', path, null, query, sort);
        cache.db[key] = null;
      } else {
        foundDoc = _(unwindPath(foundDoc, maskedPath))
          .map(p => [p, docGet(foundDoc, p)])
          .filter(([p, v]) => v.match(slugRx))
          .sortBy('[1]')
          .last();
        cache.db[key] = foundDoc[1];
        // if (foundDoc) cache.db[key] = foundDoc[1];
        // else cache.db[key] = null;
        // console.log('db cache set', path, cache.db[key], query, sort, group);
      }
    }
  }
  return cache.db[key];
  // if (cache.db[key] !== undefined) {
    // console.log(`db cache for ${path}: ${cache.db[key]}`);
    // candidates.push(cache.db[key]);
  // }

  // let res = _(candidates.sort())
  //   .filter(c => c !== null)
  //   .last();
  // // console.log(`${path}: ${res} chosen from `,candidates);
  // return res;
  // return null;
}
let docGet = (doc, path) =>
  _.isFunction(doc.get) ? doc.get(path) : _.get(doc, path);
let docSet = (doc, path, val) =>
  _.isFunction(doc.set) ? doc.set(path, val) : _.set(doc, path, val);
let docIsModified = (doc, path) =>
  _.isFunction(doc.isModified)
    ? doc.isModified(path)
    : _.get(doc, path) !== undefined;

function unwindSlugs(doc, slugs) {
  let unwoundSlugs = [];
  slugs.forEach(slug => {
    let slugPaths = unwindPath(doc, slug.path);
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
          return docIsModified(doc, path.replace(/^\//, ''));
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

function unwindPath(doc, path, restPathParts) {
  if (restPathParts === undefined) {
    restPathParts = path.split('.$.');
    path = restPathParts[0];
    restPathParts = _.drop(restPathParts);
  }

  let res = [];
  let value = docGet(doc, path);

  if (_.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      let childPath = path + '.' + i + '.' + restPathParts[0];
      res = res.concat(unwindPath(doc, childPath, _.drop(restPathParts)));
    }
  } else {
    if (!restPathParts || !restPathParts.length) res.push(path);
  }
  return res;
}

async function setSlugs(doc, slugs, options, findOne, cache) {
  // let slugsMdfPaths = _(slugs)
  //   .map('path')
  //   .zipObject(_.fill(Array(_.size(slugs)), ''))
  //   .value();
  // console.log("slugsMdfPaths",slugsMdfPaths);
  await Promise.all(
    slugs.map(async slug => {
      var fields = [];

      slug.fields.forEach(slugField => {
        fields.push(docGet(doc, slugField.replace(/^\//, '')));
      });
      let oldSlug = docGet(doc, slug.path);
      if (
        !(slug.unique || slug.uniqueSlug) &&
        (!slug.uniqueGroupFields || !slug.uniqueGroupFields.length)
      ) {
        if (!oldSlug || !slug.permanent) {
          docSet(doc, slug.path, makeSlug(fields, options));
        }
        return;
      } else {
        var query = {};
        if (slug.uniqueGroupFields) {
          slug.uniqueGroupFields.forEach(function(fieldName) {
            fieldName = fieldName.replace(/^\//, '');
            query[fieldName] = docGet(doc, fieldName);
          });
        }
        if (!docGet(doc,slug.path) || !slug.permanent) {
          if (slug.isShortIdMode) {
            docSet(
              doc,
              slug.path,
              await makeUniqueShortIdSlug(
                doc,
                slug.path,
                fields,
                options,
                query,
                findOne,
                slug.forceShortId,
                cache,
                //slugsMdfPaths
              )
            );
          } else {
            docSet(
              doc,
              slug.path,
              await makeUniqueCounterSlug(
                doc,
                slug.path,
                fields,
                options,
                slug.padding,
                query,
                findOne,
                cache,
                //slugsMdfPaths
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
  path,
  values,
  options,
  padding,
  groups,
  findOne,
  cache,
  //slugsMdfPaths
) {
  let slug = makeSlug(values, options);
  let originalSlug = slug;
  let count = 0;

  let result = await findSame(
    cache,
    doc,
    groups,
    path,
    slug,
    true,
    options,
    findOne,
    //slugsMdfPaths
  );
  if (result) {
    count = extractCounter(result, options.separator) + 1;
    slug += options.separator + _.padStart(count, padding, '0');
  }
  updateUpdCache(cache, path, originalSlug, slug);
  // console.log('after cache', cache);
  return slug;
}

async function makeUniqueShortIdSlug(
  doc,
  path,
  values,
  options,
  groups,
  findOne,
  forceShortId,
  cache,
  //slugsMdfPaths
) {
  let slug = makeSlug(values, options);
  let originalSlug = slug;

  let result = await findSame(
    cache,
    doc,
    groups,
    path,
    slug,
    false,
    options,
    findOne,
    //slugsMdfPaths
  );
  if (result) {
    // console.log(`slug already exists at ${path}`, result);
    let oldSlug = docGet(doc, path);
    if (
      //reuse old slug if possible
      oldSlug &&
      oldSlug.match(new RegExp('^' + slug + options.separator + '.*$'))
    ) {
      // console.log("reuse old random slug",doc[path]);
      slug = oldSlug;
    } else slug += options.separator + shortId.generate();
  } else {
    if (forceShortId) {
      slug += options.separator + shortId.generate();
    }
  }
  updateUpdCache(cache, path, originalSlug, slug);
  // console.log('after cache', cache);
  return slug;
}
