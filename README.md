# prismic-element

> Extend all Prismic.io `Fragments` with a method that renders them as actual DOM elements.

## Usage

Pass the Prismic object to the function and then simply call `asElement` on your document fragments.

All fragments return a single DOM element except `Group`, `SliceZone`, and `StructuredText` which return an array if DOM elements.

```javascript
const Prismic = require('prismic.io');
const prismicElement = require('prismic-element');

prismicElement(Prismic);

Prismic.api('https://<YOUR_API_ENDPOINT>.cdn.prismic.io/api').then(api => {
  api.getSingle('my-page').then(doc => {
    const elements = doc.getStructuredText('my-page.body').asElement(resolve);
    for (const element of elements) {
      document.body.appendChild(element);
    }
  });
});

function resolve(doc) {
  return doc.slug;
}
```

## With bel

Working with DOM elements integrates beautifully with tools such as [bel](https://github.com/shama/bel), [yo-yo](https://github.com/maxogden/yo-yo) and [choo](https://github.com/yoshuawuyts/choo).

```javascript
const html = require('bel');
const Prismic = require('prismic.io');
const prismicElement = require('prismic-element');

prismicElement(Prismic);

Prismic.api('https://<YOUR_API_ENDPOINT>.cdn.prismic.io/api').then(api => {
  api.getSingle('my-page').then(doc => {
    document.body.appendChild(html`
      <article>
        ${ doc.getText('my-page.title').asElement() }

        <figure>
          ${ doc.getImage('my-page.image').asElement() }
          <figcaption>${ doc.getImage('my-page.image').alt }</figcaption>
        </figure>

        <hr />

        ${ doc.getStructuredText('my-page.body').asElement(resolve) }
      </article>
    `);
  });
});

function resolve(doc) {
  return doc.slug;
}
```

## See also
- [Prismic.io](https://prismic.io) – CMS as a service
- [bel](https://github.com/shama/bel) – Create DOM elements using tagged templates
- [yo-yo](https://github.com/maxogden/yo-yo) – Tiny library for composing UI using DOM elements
- [choo](https://github.com/yoshuawuyts/choo) - High level framework using tagged templates

## License
MIT
