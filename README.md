# mongoose-slug-updater

Sophisticated slugifier plugin for Mongoose.

[![npm](https://img.shields.io/npm/v/mongoose-slug-updater.svg)](https://www.npmjs.com/package/mongoose-slug-updater) [![Travis (.org)](https://api.travis-ci.org/YuriGor/mongoose-slug-updater.svg?branch=master)](https://travis-ci.org/YuriGor/mongoose-slug-updater) [![Coverage Status](https://coveralls.io/repos/github/YuriGor/mongoose-slug-updater/badge.svg?branch=master)](https://coveralls.io/github/YuriGor/mongoose-slug-updater?branch=master) <br>
[![NPM](https://nodei.co/npm/mongoose-slug-updater.png?compact=true)](https://nodei.co/npm/mongoose-slug-updater/)

Features:
- [Intuitive schema-based declaration](#basic-usage)
- Single or [compound](#multiple-fields-to-create-the-slug) slugs, based on any fields of the document
- [Nested docs and arrays support](#nested-docs-relative-and-absolute-paths)
- [Relative or absolute paths to the related fields](#nested-docs-relative-and-absolute-paths)
- Initial generation and [updating](#updating-slug-or-keeping-it-permanent) (or not if [permanent](#permanent-option)) on any change of related fields,
- `create`, `save`, `update`, `updateOne`, `updateMany` or `findOneAndUpdate` methods supported, and you can [switch them on/off](#updating-slug-or-keeping-it-permanent).
- [$set](#updating-by-deep-path-via-set-operator) update operator support with deep modification paths to any nested doc or array.
- [Unique slugs](#unique-slug-field) (with unique index or not), collection-wide or [by group](#unique-slug-within-a-group), nested too.
- Updating of unique slugs in case of changed related fields or group criteria.
- [Counter](#example-counter) and [shortId](#example-random) styles of duplication conflict resolving.
- Autoloading of missing related data required to build slug correctly.

## Installation

The best way to install it is using **npm**

```sh
npm install mongoose-slug-updater --save
```

## Loading

```js
var slug = require('mongoose-slug-updater');
```

## Initialization

```js
var mongoose = require('mongoose');
mongoose.plugin(slug);
```

## Usage

This plugin is based on the idea of using the **mongoose schema** as the way to check the use of slug fields.

The plugin checks and updates automatically the _slug field_ with the correct slug.

### Basic Usage

If you only want to create the slug based on a simple field.

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        slug: { type: String, slug: "title" }
});
```

### Multiple slug fields

You can add as many slug fields as you wish

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: "title" },
        slug2: { type: String, slug: "title" },
        slug3: { type: String, slug: "subtitle" }
});
```

### Multiple fields to create the slug

If you want, you can use more than one field in order to create a new slug field.

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"] }
});
```
### Transform Slug

This option accepts a funtion which receives actual field value and can be used to tranform value before generating slug.

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"], transform: v => stripHtmlTags(v) }
});
```

### Unique slug field

To create a unique slug field, you must only add add the _unique: true_ parameter in the path (also, this way the default mongo unique index gets created)

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"], unique: true }
});
```

If `unique` or `uniqueSlug` is set, the plugin searches in the mongo database, and if the slug already exists in the collection, it appends to the slug a separator (default: "-") and a random string (generated with the shortid module).

#### example random
```js
mongoose.model('Resource').create({
    title: "Am I wrong, fallin' in love with you!",
    subtitle: "tell me am I wrong, well, fallin' in love with you",
}); // slug -> 'am-i-wrong-fallin-in-love-with-you'

mongoose.model('Resource').create({
    title: "Am I wrong, fallin' in love with you!",
    subtitle: "tell me am I wrong, well, fallin' in love with you",
}); // slug -> 'am-i-wrong-fallin-in-love-with-you-Nyiy4wW9l'

mongoose.model('Resource').create({
    title: "Am I wrong, fallin' in love with you!",
    subtitle: "tell me am I wrong, well, fallin' in love with you",
}); // slug -> 'am-i-wrong-fallin-in-love-with-you-NJeskEPb5e'
```

Alternatively you can modify this behaviour and instead of appending a random string, an incremental counter will be used. For that to happen, you must use the parameter `slugPaddingSize` specifying the total length of the counter:

#### example counter
```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"], slugPaddingSize: 4,  unique: true }
});

mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you'

mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you-0001'

mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you-0002'
```

If you don't want to define your field as unique for some reasons, but still need slug to be unique,<br>
you can use `uniqueSlug:true` option instead of `unique`.<br>
This option will not cause index creation, but still will be considered by the plugin.

`forceIdSlug` option will append shortId even if no duplicates were found.<br>
This is useful for applications with high chance of concurrent modification of unique fields.<br>

Check for conflict made by plugin is not atomic with subsequent insert/update operation,<br>
so there is a possibility of external change of data in the moment between check and write.<br>
If this happened, mongo will throw unique index violation error.<br>
Chances of such case higher for counter unique mode, but with shortId this is possible too.<br>
You can just retry operation, so plugin will check collection again and regenerate correct unique slug.<br>
Or you can set `forceIdSlug` option - this will solve the problem completely, but you will pay for this by less readabilty of your slugs, because they will *always* be appended with random string.

In most cases write operations not so frequent to care about possible conflicts.

note: `forceIdSlug` option will also overwite `unique` to the `true`, and `slugPaddingSize` option will be ignored.

### Unique slug within a group

Sometimes you only want slugs to be unique within a specific group.<br>
This is done with the `uniqueGroupSlug` property which is an array of fields to group by:

#### example unique per group (using the field named 'group')

```js
ResourceGroupedUnique = new mongoose.Schema({
    title: { type: String },
    subtitle: { type: String },
    group: { type: String },
    uniqueSlug: {
        type: String,
        uniqueGroupSlug: ['group'],
        slugPaddingSize: 4,
        slug: 'title',
        index: true,
    },
});

mongoose.model('ResourceGroupedUnique').create({
    title: "Am I wrong, fallin' in love with you!",
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 1',
}); // slug -> 'am-i-wrong-fallin-in-love-with-you'

mongoose.model('ResourceGroupedUnique').create({
    title: "Am I wrong, fallin' in love with you!",
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 2',
}); // slug -> 'am-i-wrong-fallin-in-love-with-you'

mongoose.model('ResourceGroupedUnique').create({
    title: "Am I wrong, fallin' in love with you!",
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 1',
}); // slug -> 'am-i-wrong-fallin-in-love-with-you-0001'

mongoose.model('ResourceGroupedUnique').create({
    title: "Am I wrong, fallin' in love with you!",
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 2',
}); // slug -> 'am-i-wrong-fallin-in-love-with-you-0001'
```

**Important: you must not have a `unique: true` option, but it's a good idea to have an `index: true` option.**

### Nested unique slugs
MongoDB supports unique index for nested arrays elements, but he checks for duplication conflicts only on per-document basis, so inside document duplicate nested array's elements are still allowed. <br>
mongoose-slug-updater works differently. It checks slug for duplicates both in current documentts's nested array and in other documents, considering uniqueGroupSlug option, if specified.

#### example of nested unique slugs
```js
const UniqueNestedSchema = new mongoose.Schema({
  children: [
    {
      subchildren: [
        {
          title: { type: String },
          slug: {
            type: String,
            slug: 'title',
            unique: true // 'global' unique slug
            slugPaddingSize: 4,
          },
          slugLocal: {
            type: String,
            slug: 'title',
            index: true,
            slugPaddingSize: 4,
            uniqueGroupSlug: '/_id',// slug unique within current document
          },
        },
      ],
    },
  ],
});
```
```js
mongoose.model('UniqueNestedSchema').create({
  children:[
    {
      subchildren:[
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you'
        },
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you-0001'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0001'
        },
      ]
    },
    {
      subchildren:[
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you-0002'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0002'
        },
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you-0003'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0003'
        },
      ]
    },
  ]
});
mongoose.model('UniqueNestedSchema').create({
  children:[
    {
      subchildren:[
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you-0004'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you'
        },
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you-0005'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0001'
        },
      ]
    },
    {
      subchildren:[
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you-0006'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0002'
        },
        {
          title: "Am I wrong, fallin' in love with you!"
          // slug       -> 'am-i-wrong-fallin-in-love-with-you-0007'
          // slugLocal  -> 'am-i-wrong-fallin-in-love-with-you-0003'
        },
      ]
    },
  ]
});
```

In case of change unique slug related fields (source fields from `slug` option or group criteria from `uniqueGroupSlug`) <br>
slug will be regenerated considering latest existing duplicate. Presence or lack of the older duplicates, including original slug, will not be taken into account.

### Updating slug or keeping it permanent

By default slugs will be created/updated for any related fields changed by any of `create`(it's actually a `save` too), `save`, `update`, `updateOne`, `updateMany` and `findOneAndUpdate` operations.
You can specify which of supported methods should be watched:

```js
const HooksSchema = new mongoose.Schema({
    title: { type: String },
    slug: {
        type: String,
        slug: 'title',
        //by default all hooks are enabled
        //slugOn:{ save: true, update: true, updateOne: true, updateMany: true, findOneAndUpdate: true }
    },
    slugNoSave: { type: String, slug: 'title', slugOn: { save: false } },
    slugNoUpdate: { type: String, slug: 'title', slugOn: { update: false } },
    slugNoUpdateOne: { type: String, slug: 'title', slugOn: { updateOne: false } },
    slugNoUpdateMany: {
        type: String,
        slug: 'title',
        slugOn: { updateMany: false },
    },
    slugNoFindOneAndUpdate: {
        type: String,
        slug: 'title',
        slugOn: { findOneAndUpdate: false },
    },
});
```

Note, that flags will affect both creation and updating of documents. <br>
If you disabled `save` and still want slug to be generated initially, `create` method will not work, <br>
becacuse mongoose emits `save` event both for `save` and `create` methods. <br>
Use `upsert` option of `update***` methods instead.

For `update` and `updateMany` methods multiply affected records also handled, but be careful with performance,
because one-by-one iteration over affected documents may happen in case of unique slugs.<br>
In this case `_id` field is required.

For `update*` family of operations additional queries may be performed, to retrieve data missing in the query (fields not listed in the query but needed for compound or grouped unique slugs).<br>

#### `permanent` option

If you want to generate slug initially, but keep it unchanged during further modifications of related fields, use `permanent` flag like this:

```js
ResourcePermanent = new mongoose.Schema({
    title: { type: String },
    subtitle: { type: String },
    otherField: { type: String },
    slug: { type: String, slug: ['title', 'subtitle'] }, //normal slug
    titleSlug: { type: String, slug: 'title', permanent: true }, //permanent slug
    subtitleSlug: {
        type: String,
        slug: 'subtitle',
        permanent: true, //permanent option
        slugPaddingSize: 4,
    },
});
```

### Nested docs. Relative and absolute paths.
Nested docs and arrays declared inline right in the scheme or as a nested schemas declared separately are also supported.

Slug fields can be declared as relative or absolute(starting with slash) path to any point of current document.

Since MongoDB uses dot path notation, colon `:` symbol used for relative paths as a reference to the parent, same as double dot `..` for file system paths.

Example of scheme with inline nested docs:
```js
const InlineSchema = new mongoose.Schema({
  // root title
  title: { type: String },
  // root slug with relative path to root title
  slug: { type: String, slug: 'title' },
  // root slug with  absolute path to root title
  absoluteSlug: { type: String, slug: '/title' },
  // root slug with relative path to child title
  childSlug: { type: String, slug: 'child.title' },
  // root slug with absolute path to child title
  absoluteChildSlug: { type: String, slug: '/child.title' },
  // root slug with relative path to child's subchild title
  subChildSlug: { type: String, slug: 'child.subChild.title' },
  // root slug with relative path to the title of first children array element
  childrenSlug0: { type: String, slug: 'children.0.title' },
  // root slug with relative path to the title of 5th children array element
  childrenSlug4: { type: String, slug: 'children.4.title' },
  // root slug with relative path to the title of 4th subChildren' element of first children array element
  subChildrenSlug3: { type: String, slug: 'children.0.subChildren.3.title' },
  // root slug with relative path to the title of 8th subChildren' element of first children array element
  subChildrenSlug7: { type: String, slug: 'children.0.subChildren.7.title' },
  subChildrenSlug5SubChild: {
    type: String,
    // well, you see)
    slug: 'children.0.subChildren.5.subChild.title',
  },
  subChildrenSlug2SubChild: {
    type: String,
    slug: 'children.0.subChildren.2.subChild.title',
  },
  child: {
    title: { type: String },
    // inside nested doc relative path starts from current object,
    // so this is slug for child's title
    slug: { type: String, slug: 'title' },
    // absolute variant of path above, starting from root
    absoluteSlug: { type: String, slug: '/child.title' },
    // child's slug field generated for root title, absolute path
    absoluteParentSlug: { type: String, slug: '/title' },
    // relative path with parent reference `:`, so here root title will be used again.
    relativeParentSlug: { type: String, slug: ':title' },
    subChild: {
      title: { type: String },
      // relative path to the title of current nested doc,
      // in absolute form it wil be /child.subChild.title
      slug: { type: String, slug: 'title' },
      // absolute path to the root title
      absoluteParentSlug: { type: String, slug: '/title' },
      // relative path to the parent title, /child.title in this case
      relativeParentSlug: { type: String, slug: ':title' },
      // parent of the parent is root, so ::title = /title here
      relativeGrandParentSlug: { type: String, slug: '::title' },
    },
  },
  // nested arrays work too
  children: [
    {
      title: { type: String },
      // title of current array element
      slug: { type: String, slug: 'title' },
      // root title
      absoluteRootSlug: { type: String, slug: '/title' },
      // child's title
      absoluteChildSlug: { type: String, slug: '/child.title' },
      // root title. Array itself not counted as a parent and skipped.
      relativeRootSlug: { type: String, slug: ':title' },
      // absolute path to 4th element of array
      absoluteSiblingSlug: { type: String, slug: '/children.3.title' },
      // same in relative form for 5th element
      relativeSiblingSlug: { type: String, slug: ':children.4.title' },
      subChild: {
        title: { type: String },
        // current title
        slug: { type: String, slug: 'title' },
        // root title
        absoluteParentSlug: { type: String, slug: '/title' },
        // child title
        absoluteChildSlug: { type: String, slug: '/child.title' },
        // title of current array element, because its a parent of this subChild
        relativeParentSlug: { type: String, slug: ':title' },
        // two parents up is a root
        relativeGrandParentSlug: { type: String, slug: '::title' },
      },
      // arrays nested into array elements, welcome to the depth
      subChildren: [
        {
          title: { type: String },
          // current title
          slug: { type: String, slug: 'title' },
          // root title
          absoluteRootSlug: { type: String, slug: '/title' },
          // child title
          absoluteChildSlug: { type: String, slug: '/child.title' },
          // :--> children :--> root
          relativeRootSlug: { type: String, slug: '::title' },
          absoluteSiblingSlug: {
            type: String,
            // I don't know who will need it but it works, check yourself in /test
            slug: '/children.0.subChildren.5.title',
          },
          // relative ref to another subChildren's element from current children's element
          relativeSiblingSlug: { type: String, slug: ':subChildren.6.title' },
          // hope you got it.
          subChild: {
            title: { type: String },
            slug: { type: String, slug: 'title' },
            absoluteParentSlug: { type: String, slug: '/title' },
            absoluteChildSlug: { type: String, slug: '/child.title' },
            relativeParentSlug: { type: String, slug: ':title' },
            relativeGrandParentSlug: { type: String, slug: '::title' },
          },
        },
      ],
    },
  ],
});
```
Example of nested schemas declared separately:
```js
const SubChildSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title' },
  absoluteRootSlug: { type: String, slug: '/title' },
  absoluteChildSlug: { type: String, slug: '/child.title' },
  relativeParentSlug: { type: String, slug: ':title' },// child's title
  relativeGrandParentSlug: { type: String, slug: '::title' },//parent's title
});

const ChildSchema = new mongoose.Schema({
  title: { type: String },
  subChild: SubChildSchema,
  subChildren: [SubChildSchema],
  slug: { type: String, slug: 'title' },
  subChildSlug: { type: String, slug: 'subChild.title' },
  absoluteSlug: { type: String, slug: '/child.title' },
  absoluteRootSlug: { type: String, slug: '/title' },
  relativeParentSlug: { type: String, slug: ':title' },//Parent
  subChildrenSlug2: { type: String, slug: 'subChildren.2.title' },
  subChildrenSlug3: { type: String, slug: 'subChildren.3.title' },
});

const ParentSchema = new mongoose.Schema({
  title: { type: String },
  child: ChildSchema,
  children: [ChildSchema],
  slug: { type: String, slug: 'title' },
  absoluteSlug: { type: String, slug: '/title' },
  childSlug: { type: String, slug: 'child.title' },
  absoluteChildSlug: { type: String, slug: '/child.title' },
  subChildSlug: { type: String, slug: 'child.subChild.title' },
  childrenSlug0: { type: String, slug: 'children.0.title' },
  childrenSlug4: { type: String, slug: 'children.4.title' },
  subChildrenSlug3: { type: String, slug: 'children.7.subChildren.3.title' },
  subChildrenSlug7: { type: String, slug: 'children.3.subChildren.7.title' },
});
```

#### Updating by deep path via $set operator

This will work too:
```js
  await SimpleInline.findOneAndUpdate(
    {/*some criteria*/},
    {
      $set: {
        title: 'New root title',
        'child.title': 'New nested title',
        'children.2.title': 'New title for the 3d item of nested array',
      },
    }
  );
```
All the slugs which depend on modified titles will be found and regenerated.<br>
This is recommended way to do partial modifications.<br>
When you perform updates by object value instead of path:value list,<br>
unobvious data loss may happen for nested docs or arrays, if they contain slugs affected by your modification.<br>
Plugin always checks will current update operation be made with $set operator or not, and adds extra slug fields to the query as an object fields or $set paths accordingly.

So if you do have whole document you want to change - better use `save`,<br>
but if you dont have it, but you need to update some particular fields - it's more safe to use $set and paths:values.

### Choose your own options

You can change any options adding to the plugin

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    options = {
        separator: "-",
        lang: "en",
        truncate: 120,
        backwardCompatible: true//support for the old options names used in the mongoose-slug-generator
    },
    mongoose.plugin(slug, options),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"], unique: true }
});
```

You can find more options in the [speakingURL's npm page](https://www.npmjs.com/package/speakingurl)

## Support

This plugin is supported by [Yuri Gor](http://yurigor.com/)

### About

This plugin was initially forked from [mongoose-slug-generator](https://github.com/Kubide/mongoose-slug-generator), which is not maintained currently.

Merged and fixed `uniqueGroupSlug` feature by [rickogden](https://github.com/rickogden).

`update`, `updateOne`, `updateMany` and `findOneAndUpdate` operations support implemented.

Nested docs and arrays support implemented.

Absolute and relative paths added.

Updating with $set operator and deep paths now works too.

All the update operators will be implemented soon.

Plugin rewritten with modern js and a lot of tests were added.