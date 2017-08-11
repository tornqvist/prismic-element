# prismic-element

Mimics [prismic-dom](https://github.com/prismicio/prismic-dom) except that it renders _real_ DOM nodes and not just HTML strings.

*NOTE:*

Requires version 2 of the Prismic.io API and the compatible JavaScript library [prismic-javascript](https://github.com/prismicio/prismic-javascript).

## Usage

Pass a rich text object to the function and get HTML Element(s) back.

```javascript
const Prismic = require('prismic-javascript');
const asElement = require('prismic-element');

Prismic.api('https://<YOUR_API_ENDPOINT>.cdn.prismic.io/api').then(api => {
  api.getSingle('my-page').then(doc => {
    document.body.appendChild(asElement(doc.data.body));
  });
});
```

## With bel

Working with DOM elements integrates beautifully with tools such as [bel](https://github.com/shama/bel), [yo-yo](https://github.com/maxogden/yo-yo) and [choo](https://github.com/yoshuawuyts/choo).

```javascript
const html = require('bel');
const Prismic = require('prismic-javascript');
const asElement = require('prismic-element');

Prismic.api('https://<YOUR_API_ENDPOINT>.cdn.prismic.io/api').then(api => {
  api.getSingle('my-page').then(doc => {
    document.body.appendChild(html`
      <article>
        ${ asElement(doc.data.title) }

        <figure>
          ${ asElement(doc.data.image) }
          <figcaption>${ doc.data.image.alt }</figcaption>
        </figure>

        <hr />

        ${ asElement(doc.data.body) }
      </article>
    `);
  });
});
```

## See also
- [Prismic.io](https://prismic.io) – CMS as a service
- [bel](https://github.com/shama/bel) – Create DOM elements using tagged templates
- [yo-yo](https://github.com/maxogden/yo-yo) – Tiny library for composing UI using DOM elements
- [choo](https://github.com/yoshuawuyts/choo) - High level framework using tagged templates

## License
MIT
