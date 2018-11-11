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
    },
    options
  );

  var slugs = [];

  // console.log(' === schema === ');
  // if(schema.paths.children){
  //   console.log(schema.paths.children.constructor.name);
  // }
  function schemaTraversal(schema, basePath, cb) {
    if (basePath) basePath += '.';
    schema.eachPath(function(schemaPath, schemaType) {
      /* console.log(
        basePath + schemaPath + ':' + schemaType.constructor.schemaName
      ); */
      if (schemaType.constructor.schemaName === undefined) {
        // console.log(schemaType);
      }
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
  schemaTraversal(schema, '', (schemaPath, schemaType) => {
    // console.log(schemaType.constructor.schemaName);
    // if(schemaType.constructor.schemaName=="DocumentArray"){
    // console.log(schemaType.caster.schema.obj);
    // console.log(schema);
    // }
    // console.log(schemaPath, schemaType.constructor.name);
    // console.log(Object.keys(schemaType));
    if (schemaType.instance == 'Array') {
      // console.log(schemaType.getters);
    }
    if (
      schemaType.instance == 'String' &&
      schemaType.options &&
      schemaType.options.slug
    ) {
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
          ...(schemaType.options.on || {}),
        },
      };

      if (typeof schemaType.options.slug === 'string') {
        slug.fields = [schemaType.options.slug];
      } else if (schemaType.options.slug instanceof Array) {
        slug.fields = schemaType.options.slug;
      } else {
        return;
      }
      // slug.fields = slug.fields.map(v => {
      //   if (_.startsWith(v, '/')) return v.substr(1);
      //   return (slug.path && slug.path + '.') + v;
      // });
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
        if (_.isArray(schemaType.options.uniqueGroup)) {
          slug.uniqueGroupFields = schemaType.options.uniqueGroup;
        } else {
          slug.uniqueGroupFields = [schemaType.options.uniqueGroup];
        }
      }
      if (schemaType.options.force_id) {
        slug.unique = true;
        slug.isShortIdMode = true;
        slug.forceShortId = true;
      }
      slugs.push(slug);
    }
  });
  //
  //   schema.post('save', function(error, res, next) {
  //     console.log('post save', this);
  //     next();
  //   });

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
    // console.log('pre-'+operation,me.getUpdate());
    let upd = me.getUpdate();
    // console.debug('preupdateOne before',me.getQuery(), upd);
    let doc = _.cloneDeep(upd);
    if (doc.$set) {
      // console.log(doc.$set);
      _.forOwn(doc.$set, (v, k) => {
        _.set(doc, k, v);
      });
      delete doc.$set;
      // console.log(doc);
    }
    let docs = [_.cloneDeep(doc)];

    let unwoundSlugs = unwindSlugs(
      doc,
      _.filter(slugs, `on.${operation}`),
      _.get,
      updIsModified
    );
    if (!unwoundSlugs.length) {
      // console.log('no slugs');
      return;
    }
    // console.log(_.map(unwoundSlugs,'path'));

    let updFields = _.keysDeep(doc);
    let updPaths = _.map(updFields, f =>
      _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.')
    );
    // console.log(updFields);
    // console.log(updPaths);
    // console.log("unwoundSlugs",unwoundSlugs);
    let involvedPaths = _.uniq(
      unwoundSlugs.reduce(
        (acc, slug) => acc.concat(slug.fields).concat([slug.path]),
        []
      )
    );
    // .filter(val => updPaths.indexOf(val) == -1);
    // console.log('involvedPaths', involvedPaths);

    let involvedValuesDocs = await me.model[
      operation == 'updateOne' ? 'findOne' : 'find'
    ](
      me.getQuery(),
      _(involvedPaths)
        .map(k => [k.replace(/\.\d+\./g, '.'), 1])
        .fromPairs()
        .value()
    );
    // console.log("involvedValuesDocs",involvedValuesDocs);
    if (involvedValuesDocs) {
      if (!_.isArray(involvedValuesDocs))
        involvedValuesDocs = [involvedValuesDocs];
      involvedValuesDocs.forEach((freshDoc, i) => {
        if (i) docs[i] = _.cloneDeep(doc);
        involvedPaths.forEach(function(f) {
          if (_.get(docs[i], f) === undefined)
            _.set(docs[i], f, _.get(freshDoc, f));
        });
        if (freshDoc && freshDoc._id) docs[i]._id = freshDoc._id;
      });
    }
    // console.log("docs",docs);
    let slugsUpd = [];
    async function findOne(query, sort) {
      let res = me.model.findOne(query);
      if (sort) {
        res = res.sort(sort);
      }
      res = await res;
      if (slugsUpd.length && sort) {
        // console.log("findOne res",res);
        let field = _.first(_.keys(sort));
        let top = _.maxBy(slugsUpd, (u)=>{
          // if(_.get(u,field)===undefined){
          //   console.log(field);
          //   console.log(u);
          // }
          return extractCounter(_.get(u,field),options.separator);
        });
        // console.log("findOne top",top);
        if (_.has(top, field)) {
          let localCounter = extractCounter(_.get(top,field),options.separator);
          let dbCounter = extractCounter(res.get(field),options.separator);
          if(localCounter>dbCounter)
            res = top;
        }
      }
      return res;
    }
    // console.log("docs",docs);
    // console.log("doc",doc);
    for (let i = 0; i < docs.length; i++) {
      let actualSlugs = unwoundSlugs;
      if (involvedValuesDocs && involvedValuesDocs.length) {
        let actualUpdFields = _(updFields)
          .filter(f => {
            // console.log(_.get(doc, f),_.get(docs[i], f));
            return _.get(doc, f) != _.get(involvedValuesDocs[i], f);
          })
          .map(f => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
          .value();
        // console.log("actualUpdFields",actualUpdFields,updFields);
        actualSlugs = _.filter(unwoundSlugs, s => {
          return _.intersection(
            s.fields.concat(s.uniqueGroupFields || []),
            actualUpdFields
          ).length;
        });
        // console.log("actualSlugs",actualSlugs);
      }
      if (actualSlugs.length){
        await setSlugs(docs[i], actualSlugs, options, _.get, _.set, findOne);
      }
      // console.log("after setSlugs",docs[i]);
      slugsUpd[i] = _.cloneDeep(upd.$set || upd);
      actualSlugs.forEach(slug => {
        let slugVal = _.get(docs[i], slug.path);
        // if(slugVal==="0-am-i-wrong-fallin-in-love-with-you")
        //   console.log("000 ",slug);
        if (slugVal != undefined) _.set(slugsUpd[i], slug.path, slugVal);
      });
      if (involvedValuesDocs && involvedValuesDocs.length) {
        _.each(unwoundSlugs, us => {
          if (_.get(slugsUpd[i], us.path) === undefined) {
            let val = _.get(involvedValuesDocs[i], us.path);
            if (val !== undefined) _.set(slugsUpd[i], us.path, val);
            // else{
            //   console.log("not found",us.path);
            //   console.log(involvedValuesDocs[i]);
            // }
          }
        });
      }

      let doUpd = slugsUpd[i];
      if (upd.$set) {
        // console.log(_.indexate(slugsUpd[i],{ leafsOnly: true }));
        // console.log(slugsUpd[i]);
        let slugPaths = _(slugsUpd[i])
          .indexate({ leafsOnly: true })
          // .mapValues(v=>_.isArray(v)?[]:(_.isObject(v)?{}:v))
          .mapKeys((v, f) => _.trim(f.replace(/\["?(.+?)"?\]/g, '.$1'), '.'))
          .value();
        doUpd = { $set: slugPaths };
      }
        // console.log('upd',doUpd);

      if (docs.length == 1) {
        if (slugsUpd[i]) me[operation]({}, doUpd);
        // console.log(me.getUpdate());
      } else {
        if (!docs[i]._id)
          throw new Error(
            'Cannot update slug massively, because _id not found for each doc.'
          );
        if (doUpd){
          // if(operation=="updateMany")
          //   console.log("updateMany");
          //   console.log(slugsUpd[i].child&&slugsUpd[i].child.slugShort||null);
          await me.model.updateOne({ _id: docs[i]._id }, doUpd);
        }
      }
    }
  }

  /**
   * Executed before save value
   */
  schema.pre('save', async function() {
    let doc = this;
    if (!doc.model) {
      // console.log('skip childs, process root only.');
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
    // console.log('slugs',slugs);
    doc = await setSlugs(
      doc,
      unwoundSlugs,
      options,
      docGet,
      docSet,
      async (query, sort) => {
        let res = doc.model(doc.constructor.modelName).findOne(query);
        if (sort) res = res.sort(sort);
        res = await res;
        // console.log("save findOne res", res&&res.get('uniqueSlug')||null);
        return res;
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
    let basePath = slug.basePath;
    // console.log(slug.path,'vs',slug.path);
    if (_.endsWith(basePath, '.$')) basePath += '.';
    slugPaths.forEach(slugPath => {
      let unwoundBasePath = slugPath.replace(/\.[^\.]+$/, '');
      if (unwoundBasePath == slugPath) unwoundBasePath = '';
      // console.log("unwoundBasePath",unwoundBasePath);
      function unwindFieldPath(fieldPath) {
        let slugValueBasePath = unwoundBasePath;
        while (_.startsWith(fieldPath, ':')) {
          // console.log("relative path ",slugValueBasePath,fieldPath);
          let prevValueBasePath = slugValueBasePath;
          if (slugValueBasePath.match(/\.\d+$/)) {
            slugValueBasePath = slugValueBasePath.replace(/\.\d+$/, '');
            prevValueBasePath = slugValueBasePath;
          }
          slugValueBasePath = slugValueBasePath.replace(/\.[^\.]+$/, '');
          if (slugValueBasePath == prevValueBasePath) slugValueBasePath = '';
          fieldPath = fieldPath.substr(1);
          // console.log("unwind relative path ",slugValueBasePath,fieldPath);
        }
        if (!_.startsWith(fieldPath, '/'))
          fieldPath =
            ((slugValueBasePath && slugValueBasePath + '.') || '') + fieldPath;
        else fieldPath = fieldPath.substr(1);
        return fieldPath;
      }
      let unwoundFields = slug.fields.map(unwindFieldPath);
      let unwoundGroupPaths = (slug.uniqueGroupFields || []).map(
        unwindFieldPath
      );
      if (
        _.some(unwoundFields.concat(unwoundGroupPaths), path => {
          return isModified(doc, path);
        })
      ) {
        let s = _.cloneDeep(slug);
        s.path = slugPath;
        s.basePath = unwoundBasePath;
        s.fields = unwoundFields;
        s.uniqueGroupFields = unwoundGroupPaths;
        unwoundSlugs.push(s);
      } else {
        // console.log('fields not changed', unwoundFields);
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
  // console.log('isNestedModified',path,restPathParts);
  let res = [];
  let value = get(doc, path);
  // console.log("unwindPath",doc,path,value);
  if (_.isArray(value)) {
    // console.log('value is array?',_.isArray(value),value.length);
    for (let i = 0; i < value.length; i++) {
      let childPath = path + '.' + i + '.' + restPathParts[0];
      // console.log('lets check', childPath);
      res = res.concat(unwindPath(doc, childPath, get, _.drop(restPathParts)));
    }
  } else {
    if (!restPathParts || !restPathParts.length) res.push(path);
  }
  return res;
}

async function setSlugs(doc, slugs, options, get, set, findOne) {
  // console.log('setSlugs', slugs);
  await Promise.all(
    slugs.map(async slug => {
      var fields = [];

      slug.fields.forEach(slugField => {
        // console.log("get",doc,slugField);
        fields.push(get(doc, slugField));
      });
      let oldSlug = get(doc, slug.path);
      if (
        !(slug.unique || slug.unique_slug) &&
        (!slug.uniqueGroupFields || !slug.uniqueGroupFields.length)
      ) {
        if (!oldSlug || !slug.permanent) {
          set(doc, slug.path, makeSlug(fields, options));
          // console.log('slug set',slug.path,fields);
        } else {
          // console.log('slug not set',oldSlug,slug.permanent);
        }
        // console.log('not unique slug generated',slug.path,doc);
        return;
      } else {
        var query = {};
        if (slug.uniqueGroupFields) {
          slug.uniqueGroupFields.forEach(function(fieldName) {
            query[fieldName] = doc[fieldName];
          });
          // console.log('group query', query);
        }
        if (!doc[slug.path] || !(slug.permanent && doc[slug.path])) {
          if (slug.isShortIdMode) {
            // console.log("shortid",slug);
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
                slug.forceShortId
              )
            );
            // console.log("shortid "+slug.path,get(doc,slug.path));
          } else {
            // console.log('counter', slug);
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
            // console.log("counter "+slug.path,get(doc,slug.path));
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
function extractCounter(value,separator) {
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
  // console.log("counter slug query before",query);
  if (doc._id) {
    query['_id'] = {
      $ne: doc._id,
    };
  }
  query[field] = search;

  // field = search and doc != doc
  let result = await findOne(query, sort);
  if (result) {
    // if(result.n===0 && query["children.4.slugCounter"]){
    //   console.log("counter slug query after",query);
    //   console.log("counter slug check", result);
    // }
    count = extractCounter(result.get(field),options.separator)+1;
    slug += options.separator + pad(count, padding);
    // console.log("slug counter inc",slug);
    // if(result.n!==undefined && query["children.4.slugCounter"]){
    //   console.log(result.n+": "+field);
    //   console.log(slug);
    // }
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
  findOne,
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
    if (
      //reuse old slug if possible
      doc[field] &&
      doc[field].match(new RegExp('^' + slug + options.separator + '.*$'))
    ) {
      // console.log("reuse old random slug",doc[field]);
      slug = doc[field];
    } else slug += options.separator + shortId.generate();
  } else {
    if (forceShortId) {
      slug += options.separator + shortId.generate();
    }
  }

  return slug;
}
