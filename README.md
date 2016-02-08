# mongoose-slug-generator

Mongoose plugin for creating slugs based on mongoose schema fields. For example you can create a slug based on a document's title and author's name: _my-post-title-kevin-roosevelt_, or unique slugs based on just the title: _my-post-title-Nyiy4wW9l_.

## Installation

The best way to install it is using **npm**

```sh
npm install mongoose-slug-generator --save
```

## Loading

```js
var slug = require('mongoose-slug-generator');
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
    slug = require('mongoose-slug-generator'),
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


### Multiple fields to create the slug

If you want, you can use more than one field in order to create a new slug field.

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

To create a unique slug field, you must only add add the *unique: true* parameter in the path (also, this way the default mongo unique index gets created)

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
    slug = require('mongoose-slug-generator'),
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

