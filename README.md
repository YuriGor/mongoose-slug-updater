# mongoose-slug-updater

Mongoose plugin for creating and updating slugs based on mongoose schema fields.
Operations `save`, `update`, `updateOne`, `updateMany` and `findOneAndUpdate` are supported.
Update operators support coming soon.
For example you can create a slug based on a document's title and author's name: _my-post-title-slim-shady_, or unique slugs based on just the title: _my-post-title-Nyiy4wW9l_.

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

If _unique_ is set, the plugin searches in the mongo database, and if the slug already exists in the collection, it appends to the slug a separator (default: "-") and a random string (generated with the shortid module).

**example random**

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

Alternatively you can modify this behaviour and instead of appending a random string, an incremental counter will be used. For that to happen, you must use the parameter _slug_padding_size_ specifying the total length of the counter:

**example counter**

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"], slug_padding_size: 4,  unique: true }
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

If you don't want to define your field as unique for some reasons, but still need slug to be unique,
you can use `unique_slug:true` option instead of `unique`.
This option will not cause index creation, but still will be considered by the plugin.

### Unique slug within a group

Sometimes you only want slugs to be unique within a specific group. This is done with the `uniqueGroup` property which is an array of fields to group by:

**example unique per group (using the field named 'group')**

```js
ResourceGroupedUnique = new mongoose.Schema({
    title: { type: String },
    subtitle: { type: String },
    group: { type: String },
    uniqueSlug: {
        type: String,
        uniqueGroup: ['group'],
        slug_padding_size: 4,
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
        //on:{ save: true, update: true, updateOne: true, updateMany: true, findOneAndUpdate: true }
    },
    slugNoSave: { type: String, slug: 'title', on: { save: false } },
    slugNoUpdate: { type: String, slug: 'title', on: { update: false } },
    slugNoUpdateOne: { type: String, slug: 'title', on: { updateOne: false } },
    slugNoUpdateMany: {
        type: String,
        slug: 'title',
        on: { updateMany: false },
    },
    slugNoFindOneAndUpdate: {
        type: String,
        slug: 'title',
        on: { findOneAndUpdate: false },
    },
});
```

Note, that flags will affect both creation and updating of documents,
so if you disabled `save` and still want slug to be generated initially,
use `upsert` option of `update***` methods.
On `update` and `updateMany` multiply affected records also handled, but be careful with performance,
because one-by-one iteration over affected documents may happen in case of unique slugs.
In this case `_id` field is required.
For `update*` family of operations additional queries may be performed, to retrieve data missing in the query.
For example if compound slug was affected by this update.
So if you already have necessary data - it's better for performance to specify all the fields listed in the compound slug and old slug value in update query.

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
        slug_padding_size: 4,
    },
});
```

### Nested docs. Relative and absolute paths.
Nested docs and arrays declared inline right in the scheme or as a nested schemas declared separately are also supported.

Non-unique nested slugs are currently implemented. Unique nested slugs are coming soon.

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
### Choose your own options

You can change any options adding to the plugin

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-updater'),
    options = {
        separator: "-",
        lang: "en",
        truncate: 120
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

Merged and fixed `uniqueGroup` feature by [rickogden](https://github.com/rickogden).

`update`, `updateOne`, `updateMany` and `findOneAndUpdate` operations support implemented.

Plugin rewritten with modern js and a lot of tests were added.
