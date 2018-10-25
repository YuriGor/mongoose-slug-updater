# mongoose-slug-updater

Mongoose plugin for creating and updating slugs based on mongoose schema fields. For example you can create a slug based on a document's title and author's name: _my-post-title-kevin-roosevelt_, or unique slugs based on just the title: _my-post-title-Nyiy4wW9l_.

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

The plugin checks and updates automatically the *slug field* with the correct slug.

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

To create a unique slug field, you must only add add the *unique: true* parameter in the path (also, this way the default mongo unique index gets created)

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
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you'

mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you-Nyiy4wW9l'

mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you-NJeskEPb5e'
```

Alternatively you can modify this behaviour and instead of appending a random string, an incremental counter will be used. For that to happen, you must use the parameter *slug_padding_size* specifying the total length of the counter:  

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
### Unique slug within a group

Sometimes you only want slugs to be unique within a specific group. This is done with the `uniqueGroup` property which is an array of fields to group by:

**example unique per group (using the field named 'group')**
```js
ResourceGroupedUnique = new mongoose.Schema({
    title: {type: String},
    subtitle: {type: String},
    group: {type: String},
    uniqueSlug: {type: String, uniqueGroup:['group'], slug_padding_size: 4, slug: "title", index: true}
});

 mongoose.model('ResourceGroupedUnique').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 1'
}); // slug -> 'am-i-wrong-fallin-in-love-with-you'

 mongoose.model('ResourceGroupedUnique').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 2'
}); // slug -> 'am-i-wrong-fallin-in-love-with-you'

 mongoose.model('ResourceGroupedUnique').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 1'
}); // slug -> 'am-i-wrong-fallin-in-love-with-you-0001'

 mongoose.model('ResourceGroupedUnique').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you",
    group: 'group 2'
}); // slug -> 'am-i-wrong-fallin-in-love-with-you-0001'

```
**Important: you must not have a `unique: true` option, but it's a good idea to have an `index: true` option.**

### Updating slug and keep it permanent

By default slugs will be created/updated for any related fields changed by any of `create`(it's actually a `save` too), `save`, `update`, `updateOne` and `updateMany` operations (`findOneAndUpdate` is not supported yet).
You can specify which of supported methods should be watched:

```js
const HooksSchema = new mongoose.Schema({
  title: { type: String },
  slug: { type: String, slug: 'title',
    //by default all hooks are enabled
    //on:{ save: true, update: true, updateOne: true, updateMany: true }
  },
  slugNoSave: { type: String, slug: 'title', on: { save: false } },
  slugNoUpdate: { type: String, slug: 'title', on: { update: false } },
  slugNoUpdateOne: { type: String, slug: 'title', on: { updateOne: false } },
  slugNoUpdateMany: { type: String, slug: 'title', on: { updateMany: false } },
});
```
Note, that flags will affect both creation and updating of documents,
so if you disabled `save` and still want slug to be generated initially,
use `upsert` option of `update***` methods.
On `update` and `updateMany` multiply affected records also handled, but be careful with performance,
because one-by-one iteration over affected documents may happen in case of unique slugs. In this case `_id` field is required.
For `update*` family of operations additional queries may be performed, to retrieve fields missing in the query.
For example if compound slug was affected by this update.
So if you already have necessary data - it's better for performance to specify all the fields listed in the compound slug and old slug value in update query.

#### `permanent` option
If you want to generated slug initially but keep it during further modifications of related fields, use `permanent` flag like this:
```js
ResourcePermanent = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  otherField: { type: String },
  slug: { type: String, slug: ['title', 'subtitle'] },//normal slug
  titleSlug: { type: String, slug: 'title', permanent: true },//permanent slug
  subtitleSlug: {
    type: String,
    slug: 'subtitle',
    permanent: true,//permanent option
    slug_padding_size: 4,
  },
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

`update`, `updateOne` and `updateMany` operations support implemented.

Plugin rewritten with modern js and a lot of tests were added.
