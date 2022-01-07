const html = require('nanohtml')
const raw = require('nanohtml/raw')
const { asLink } = require('@prismicio/helpers')
const { Element, serialize } = require('@prismicio/richtext')

module.exports = asElement

function serializer (linkResolver, type, element, content, children) {
  const attrs = {}
  if (element.label) attrs.class = element.label

  switch (type) {
    case Element.heading1: return html`<h1 ${attrs}>${children}</h1>`
    case Element.heading2: return html`<h2 ${attrs}>${children}</h2>`
    case Element.heading3: return html`<h3 ${attrs}>${children}</h3>`
    case Element.heading4: return html`<h4 ${attrs}>${children}</h4>`
    case Element.heading5: return html`<h5 ${attrs}>${children}</h5>`
    case Element.heading6: return html`<h6 ${attrs}>${children}</h6>`
    case Element.paragraph: return html`<p ${attrs}>${children}</p>`
    case Element.preformatted: return html`<pre ${attrs}>${children}</pre>`
    case Element.strong: return html`<strong ${attrs}>${children}</strong>`
    case Element.em: return html`<em ${attrs}>${children}</em>`
    case Element.listItem:
    case Element.oListItem: return html`<li ${attrs}>${children}</li>`
    case Element.list: return html`<ul ${attrs}>${children}</ul>`
    case Element.oList: return html`<ol ${attrs}>${children}</ol>`
    case Element.image: return serializeImage(linkResolver, element)
    case Element.embed: return serializeEmbed(element)
    case Element.hyperlink: return serializeHyperlink(linkResolver, element, children)
    case Element.label: return serializeLabel(element, children)
    case Element.span: return serializeSpan(content)
    default: return null
  }
}

function serializeImage (linkResolver, element) {
  const img = html`<img src="${element.url}" alt="${element.alt || ''}" width="${element.dimensions.width}" height="${element.dimensions.height}">`

  let attrs
  if (element.linkTo) {
    attrs = { href: asLink(element.linkTo, linkResolver) }
    if (element.linkTo.target && element.linkTo.target === '_blank') {
      attrs.target = '_blank'
      attrs.rel = 'noopener noreferrer'
    }
  }

  return html`
    <p class="${element.label || ''} block-img">
      ${attrs ? html`<a ${attrs}>${img}</a>` : img}
    </p>
  `
}

function serializeEmbed (element) {
  const attrs = {}
  if (element.embed_url) attrs['data-oembed'] = element.embed_url
  if (element.type) attrs['data-oembed-type'] = element.type
  if (element.provider_name) attrs['data-oembed-provider'] = element.provider_name
  if (element.label) attrs.class = element.label
  return html`
    <div ${attrs}>
      ${raw(element.oembed.html)}
    </div>
  `
}

function serializeHyperlink (linkResolver, element, children) {
  const attrs = { href: asLink(element.data, linkResolver) }
  if (element.data.target && element.data.target === '_blank') {
    attrs.target = '_blank'
    attrs.rel = 'noopener noreferrer'
  }
  return html`<a ${attrs}>${children}</a>`
}

function serializeLabel (element, children) {
  const attrs = {}
  if (element.data.label) attrs.class = element.data.label
  return html`<span ${attrs}>${children}</span>`
}

function serializeSpan (content) {
  let str = content.toString()

  if (typeof window === 'undefined') {
    str = str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  if (str && str.indexOf('\n') !== -1) {
    return raw(str.replace(/\n/g, '<br />'))
  }
  return str
}

function asElement (richText, linkResolver, customSerializer) {
  const elements = serialize(richText, function (...args) {
    if (customSerializer) return customSerializer(...args)
    return serializer(linkResolver, ...args)
  })
  if (elements.length === 1) return elements[0]
  return elements
}
