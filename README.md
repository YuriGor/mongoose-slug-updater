# mongoose-slug-generator

Mongoose plugin for create slugs based on others fields

## Install

The best way to install is using **npm**
```sh
npm install mongoose-slug-generator
```

## Loading

```js
var slug = require('mongoose-slug-generator');
```

## Inintialization

```js
  var mongoose = require('mongoose');
  mongoose.plugin(slug);
```

## Usage

This plugin is based on the idea of use the **mongoose schema** as the way to check the use of slugs fields.

The plugin check and update automatically the *slug field* with the correct Slug.

### Basic Usage

If you only wan to create the slug based on a simple field.
```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-generator'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        slug: { type: String, slug: "title" }
});
```


### Multiple slugs fields

You can add as many slugs' fields as you wish
```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-generator'),
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


### Multiple fileds to create the Slug

If you want, you can use more than one field in order to create a new Slug field.

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-generator'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"] }
});
```


### Unique slug field

To create a unique slug field, only must to add the *unique: true* parameter in the path (also, this way create the unique index)

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-generator'),
    mongoose.plugin(slug),
    Schema = mongoose.Schema,
    schema = new Schema({
        title: String,
        subtitle: String,
        slug: { type: String, slug: ["title", "subtitle"], unique: true }
});
```

If unique is set, the plugin search in the mongo database and, if exists, add to the slug a separator (default: "-") and a incremental number.


**example**

```js
mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you'

mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you-1'

mongoose.model('Resource').create({
    title: 'Am I wrong, fallin\' in love with you!',
    subtitle: "tell me am I wrong, well, fallin' in love with you"
}) // slug -> 'am-i-wrong-fallin-in-love-with-you-2'
```


### Choose your own options

You can change any options adding to the plugin

```js
var mongoose = require('mongoose'),
    slug = require('mongoose-slug-generator'),
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

This plugin is proudly supported by [Kubide](http://kubide.es/)

