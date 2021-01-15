const _ = require('deepdash')(require('lodash'));

const getSlug = require('speakingurl');

const shortId = require('shortid');

module.exports = function plugin(schema, options) {
  options = _.merge(
    {
      separator: '-',
      lang: 'en',
      truncate: 120,
      backwardCompatible: true,
    },
    options,
  );

  const slugs = [];

  function schemaTraversal(schema, basePath, cb) {
    if (basePath) basePath += '.';
    schema.eachPath((schemaPath, schemaType) => {
      if (schemaType.caster && schemaType.caster.schema) {
        schemaTraversal(
          schemaType.caster.schema,
          basePath +
            schemaPath +
            (schemaType.constructor.schemaName == 'DocumentArray' ? '.$' : ''),
          cb,
        );
      } else {
        cb(basePath + schemaPath, schemaType);
      }
    });
  }
  function renameOldOptions(opts) {
    if (!options.backwardCompatible) return opts;
    const res = _.cloneDeep(opts);
    const deprecated = ['unique_slug', 'slug_padding_size'];
    const found = [];
    _.each(deprecated, (oldo) => {
      if (res[oldo] !== undefined) {
        const newo = _.camelCase(oldo);
        found.push([oldo, newo]);
        res[newo] = res[oldo];
        delete res[oldo];
      }
    });
    if (found.length) {
      console.log(
        'Deprecated "snake_case" options found by slug updater plugin. Please update to camelCase.',
        found,
      );
    }
    if (res.uniqueGroup) {
      res.uniqueGroupSlug = res.uniqueGroup;
      delete res.uniqueGroup;
      console.log(
        'Deprecated option "uniqueGroup" found by slug updater. Please update to uniqueGroupSlug.',
      );
    }
    if (res.force_id) {
      res.forceIdSlug = res.force_id;
      delete res.force_id;
      console.log(
        'Deprecated option "force_id" found by slug updater. Please update to forceIdSlug.',
      );
    }
    if (res.on) {
      res.slugOn = res.on;
      delete res.on;
      console.log('Deprecated option "on" found by slug updater. Please update to slugOn.');
    }
    return res;
  }
  schemaTraversal(schema, '', (schemaPath, schemaType) => {
    if (schemaType.instance == 'String' && schemaType.options && schemaType.options.slug) {
      const opts = renameOldOptions(schemaType.options);
      let basePath = schemaPath.replace(/[.][^.]+$/, '');
      if (basePath === schemaPath) basePath = '';
      const slug = {
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
        console.warn(
          `slug option expected to be string or array. ${typeof opts.slug} found and will be ignored.`,
        );
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
      if (opts.transform) {
        slug.transform = opts.transform;
      }
      slugs.push(slug);
    }
  });
  // console.log(slugs);
  schema.pre('update', async function () {
    return onUpdate.bind(this)('update');
  });

  schema.pre('updateOne', async function () {
    return onUpdate.bind(this)('updateOne');
  });

  schema.pre('updateMany', async function () {
    return onUpdate.bind(this)('updateMany');
  });

  schema.pre('findOneAndUpdate', async function () {
    // console.log('pre findOneAndUpdate');
    return onUpdate.bind(this)('findOneAndUpdate');
  });

  async function onUpdate(operation) {
    const me = this;
    // console.log(` = ${operation} ${me.model.modelName} = \n`);
    const upd = me.getUpdate();
    const doc = _.cloneDeep(upd);
    if (doc.$set) {
      _.forOwn(doc.$set, (v, k) => {
        _.set(doc, k, v);
      });
      delete doc.$set;
    }
    const docs = [_.cloneDeep(doc)];

    const unwoundSlugs = unwindSlugs(doc, _.filter(slugs, `on.${operation}`));
    if (!unwoundSlugs.length) {
      return;
    }

    const updFields = _.keysDeep(doc);
    // let updPaths = _.map(updFields, f =>
    //   _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.')
    // );
    const involvedPaths = _.uniq(
      unwoundSlugs.reduce((acc, slug) => acc.concat(slug.fields).concat([slug.path]), []),
    ).map((p) => p.replace(/^\//, ''));
    let involvedValuesDocs = await me.model[operation == 'updateOne' ? 'findOne' : 'find'](
      me.getQuery(),
      _(involvedPaths)
        .map((k) => [k.replace(/\.[$\d]+\./g, '.'), 1])
        .fromPairs()
        .value(),
    );
    if (involvedValuesDocs) {
      if (!_.isArray(involvedValuesDocs)) involvedValuesDocs = [involvedValuesDocs];
      involvedValuesDocs.forEach((freshDoc, i) => {
        if (i) docs[i] = _.cloneDeep(doc);
        involvedPaths.forEach((f) => {
          const fs = unwindPath(freshDoc, f);
          _.each(fs, (f) => {
            if (_.get(docs[i], f) === undefined) _.set(docs[i], f, _.get(freshDoc, f));
          });
        });
        if (freshDoc && freshDoc._id) docs[i]._id = freshDoc._id;
      });
    }
    // console.log('docs', docs);

    const slugsUpd = [];
    const cache = {};
    async function findOne(query, sort) {
      let res = me.model.findOne(query);
      if (sort) {
        res = res.sort(sort);
      }
      return res;
    }
    for (let i = 0; i < docs.length; i++) {
      const currentUnwoundFields = unwindSlugs(docs[i], unwoundSlugs);
      let actualSlugs = currentUnwoundFields;
      if (involvedValuesDocs && involvedValuesDocs.length) {
        const actualUpdFields = _(updFields)
          .filter((f) => _.get(doc, f) != _.get(involvedValuesDocs[i], f))
          .map((f) => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
          .value();

        actualSlugs = _.filter(
          currentUnwoundFields,
          (s) =>
            _.intersection(
              _.map(s.fields.concat(s.uniqueGroupFields || []), (p) => p.replace(/^\//, '')),
              actualUpdFields,
            ).length,
        );
      }
      if (actualSlugs.length) {
        await setSlugs(docs[i], actualSlugs, options, findOne, cache);
      }
      slugsUpd[i] = {};
      const origUpd =
        _.reduce(
          upd.$set,
          (r, v, k) => {
            _.set(r, k, v);
            return r;
          },
          {},
        ) || upd;
      // console.log('actualSlugs', actualSlugs);
      // console.log(`docs[${i}]`, docs[i]);
      actualSlugs.forEach((slug) => {
        const slugVal = _.get(docs[i], slug.path);
        if (slugVal !== undefined) _.set(slugsUpd[i], slug.path, slugVal);
      });
      // console.log('1)slugsUpd[i]', slugsUpd[i]);
      if (involvedValuesDocs && involvedValuesDocs.length) {
        _.each(currentUnwoundFields, (us) => {
          // console.log('us.path?', us.path);
          if (!_.has(origUpd, us.path) && !_.has(slugsUpd[i], us.path)) {
            const val = _.get(involvedValuesDocs[i], us.path);
            if (val !== undefined) _.set(slugsUpd[i], us.path, val);
          }
        });
      }
      // console.log('2)slugsUpd[i]', slugsUpd[i]);

      let doUpd = slugsUpd[i];
      // console.log('doUpd', doUpd);
      if (upd.$set) {
        const slugPaths = _(doUpd)
          .index({ leafsOnly: true })
          // .mapValues(v=>_.isArray(v)?[]:(_.isObject(v)?{}:v))
          .mapKeys((v, f) => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
          .omitBy((v) => v === undefined)
          .value();
        doUpd = { $set: slugPaths };
      }

      if (docs.length == 1) {
        if (doUpd) me[operation]({}, _.merge(me.getUpdate(), doUpd));
        // console.log(me.getQuery(), me.getUpdate());
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
  }
  schema.pre('save', async function () {
    const cache = {};
    let doc = this;
    if (!doc.model) {
      return;
    }
    // console.log(` = save ${doc.constructor.modelName} = \n`);
    // console.log(doc);
    const reSlug = false;
    const unwoundSlugs = unwindSlugs(doc, _.filter(slugs, 'on.save'));

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
      cache,
    );
    // console.log(doc);
  });
};
function updateUpdCache(cache, path, slug, value, group) {
  // console.log(`updateUpdCache ${path}: ${slug}`);
  const maskedPath = path.replace(/\.[$\d]+\./g, '.$.');
  const isArrayPath = path != maskedPath;
  const localKey = `${maskedPath}:${slug}`;
  if (isArrayPath) {
    // console.log(`${path} resolves ${cache.upd[localKey].ext.path} with ${value}  \n${localKey}`);
    cache.lock[path].ext.resolveEx(value);
    delete cache.lock[path];
  } else {
    const key = `${localKey}-${JSON.stringify(group)}`;
    cache.db[key] = value;
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
  permanent
  // slugsMdfPaths
) {
  // console.log(`findSame#${doc.n} ${path}: ${slug}`);
  // console.log(cache);
  cache = _.merge(cache, { db: {}, unwind: {}, upd: {}, lock: {} });
  // console.log(cache);
  const maskedPath = path.replace(/\.[$\d]+\./g, '.$.');
  const isArrayPath = path != maskedPath;
  const slugRx = new RegExp(`^${slug}(${options.separator}${isCounter ? '(\\d+)' : '(.+)'})?$`);
  const localKey = `${maskedPath}:${slug}`;
  const key = `${localKey}-${JSON.stringify(group)}`;
  // console.log(`findSame#${doc.n} key: \n${key}`, cache);
  // let candidates = [];
  if (isArrayPath) {
    // console.log('array? maskedPath', maskedPath);
    const ext = { path };
    const updPromise = new Promise((resolve, reject) => {
      ext.resolveEx = resolve;
      ext.rejectEx = reject;
    });
    updPromise.ext = ext;
    if (cache.upd[localKey] !== undefined) {
      let res = cache.upd[localKey];
      // console.log(`${path} put lock \n${localKey}`);
      cache.upd[localKey] = updPromise;
      const fromPath = res.ext.path;
      cache.lock[path] = updPromise;
      // console.log(`${path} waits for ${fromPath} \n${localKey}`);
      res = await res;
      // console.log(`${path} got ${fromPath}  \n${localKey}`,res);
      return res;
    }
    // console.log(`${path} put lock init \n${localKey}`);
    cache.upd[localKey] = updPromise;
    cache.lock[path] = updPromise;
  }
  let query = _.cloneDeep(group);
  const sort = {};
  if (cache.db[key] === undefined) {
    const arrayPath = path.replace(/\.[$\d]+\./g, '.');
    query[arrayPath] = slugRx;
    if (doc._id) {
      if (query._id == undefined) {
        query._id = {
          $ne: doc._id,
        };
      } else if (!permanent) {
        query = false;
      }
    }
    if (query !== false) {
      if (isCounter) sort[arrayPath] = -1;
      cache.db[key] = findOne(query, sort);
    } else {
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
          .map((p) => [p, docGet(foundDoc, p)])
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
let docGet = (doc, path) => {
  return _.isFunction(doc.get) ? doc.get(path) : _.get(doc, path);
};
const docSet = (doc, path, val) =>
  _.isFunction(doc.set) ? doc.set(path, val) : _.set(doc, path, val);
const docIsModified = (doc, path) =>
  _.isFunction(doc.isModified) ? doc.isModified(path) : _.get(doc, path) !== undefined;

function unwindSlugs(doc, slugs) {
  const unwoundSlugs = [];

  slugs.forEach((slug) => {
    const slugPaths = unwindPath(doc, slug.path);
    if (!slugPaths.length) slugPaths.push(slug.path);
    let { basePath } = slug;

    if (_.endsWith(basePath, '.$')) basePath += '.';
    slugPaths.forEach((slugPath) => {
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
          fieldPath = `/${(slugValueBasePath && `${slugValueBasePath}.`) || ''}${fieldPath}`;
        }
        if (_.startsWith(fieldPath, `/${originalBasePath}`))
          fieldPath = fieldPath.replace(`/${originalBasePath}`, `/${slugValueBasePath}`);
        return fieldPath;
      }
      const unwoundFields = slug.fields.map(unwindFieldPath);

      const unwoundGroupPaths = (slug.uniqueGroupFields || []).map(unwindFieldPath);
      if (
        _.some(unwoundFields.concat(unwoundGroupPaths), (path) =>
          docIsModified(doc, path.replace(/^\//, '')),
        )
      ) {
        const s = _.cloneDeep(slug);
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
  const value = docGet(doc, path);

  if (_.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const childPath = `${path}.${i}.${restPathParts[0]}`;
      res = res.concat(unwindPath(doc, childPath, _.drop(restPathParts)));
    }
  } else if (!restPathParts || !restPathParts.length) res.push(path);
  return res;
}

async function setSlugs(doc, slugs, options, findOne, cache) {
  // let slugsMdfPaths = _(slugs)
  //   .map('path')
  //   .zipObject(_.fill(Array(_.size(slugs)), ''))
  //   .value();
  // console.log("slugsMdfPaths",slugsMdfPaths);
  await Promise.all(
    slugs.map(async (slug) => {
      const fields = [];
      slug.fields.forEach((slugField) => {
        let fieldVal = docGet(doc, slugField.replace(/^\//, ''));
        if (slug.transform) {
          fieldVal = slug.transform(fieldVal);
        }
        fields.push(fieldVal);
      });
      const oldSlug = docGet(doc, slug.path);
      if (
        !(slug.unique || slug.uniqueSlug) &&
        (!slug.uniqueGroupFields || !slug.uniqueGroupFields.length)
      ) {
        if (!oldSlug || !slug.permanent) {
          docSet(doc, slug.path, makeSlug(fields, options));
        }
      } else {
        const query = {};
        if (slug.uniqueGroupFields) {
          slug.uniqueGroupFields.forEach((fieldName) => {
            fieldName = fieldName.replace(/^\//, '');
            query[fieldName] = docGet(doc, fieldName);
          });
        }
        if (!docGet(doc, slug.path) || !slug.permanent) {
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
                // slugsMdfPaths
              ),
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
                slug.permanent
                // slugsMdfPaths
              ),
            );
          }
        }
      }
    }),
  );
  return doc;
}

function makeSlug(values, options) {
  const slug = getSlug(values.join(' '), options);
  return slug;
}
function extractCounter(value, separator) {
  let count = 0;

  const test = new RegExp(`${separator}(\\d+)$`);

  let match = null;

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
  permanent,
  // slugsMdfPaths
) {
  let slug = makeSlug(values, options);
  const originalSlug = slug;
  let count = 0;

  const result = await findSame(
    cache,
    doc,
    groups,
    path,
    slug,
    true,
    options,
    findOne,
    permanent
    // slugsMdfPaths
  );
  if (result) {
    count = extractCounter(result, options.separator) + 1;
    slug += options.separator + _.padStart(count, padding, '0');
  }
  updateUpdCache(cache, path, originalSlug, slug, groups);
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
  // slugsMdfPaths
) {
  let slug = makeSlug(values, options);
  const originalSlug = slug;

  const result = await findSame(
    cache,
    doc,
    groups,
    path,
    slug,
    false,
    options,
    findOne,
    // slugsMdfPaths
  );
  if (result) {
    // console.log(`slug already exists at ${path}`, result);
    const oldSlug = docGet(doc, path);
    if (
      // reuse old slug if possible
      oldSlug &&
      oldSlug.match(new RegExp(`^${slug}${options.separator}.*$`))
    ) {
      // console.log("reuse old random slug",doc[path]);
      slug = oldSlug;
    } else slug += options.separator + shortId.generate();
  } else if (forceShortId) {
    slug += options.separator + shortId.generate();
  }
  updateUpdCache(cache, path, originalSlug, slug, groups);
  // console.log('after cache', cache);
  return slug;
}
