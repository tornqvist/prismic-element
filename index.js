var html = require('nanohtml')
var raw = require('nanohtml/raw')
var PrismicRichText = require('prismic-richtext')
var LinkHelper = require('prismic-helpers').Link

var Elements = PrismicRichText.Elements

module.exports = asElement

function serialize (linkResolver, type, element, content, children) {
  var attrs = {}
  if (element.label) attrs.class = element.label

  switch (type) {
    case Elements.heading1: return html`<h1 ${attrs}>${children}</h1>`
    case Elements.heading2: return html`<h2 ${attrs}>${children}</h2>`
    case Elements.heading3: return html`<h3 ${attrs}>${children}</h3>`
    case Elements.heading4: return html`<h4 ${attrs}>${children}</h4>`
    case Elements.heading5: return html`<h5 ${attrs}>${children}</h5>`
    case Elements.heading6: return html`<h6 ${attrs}>${children}</h6>`
    case Elements.paragraph: return html`<p ${attrs}>${children}</p>`
    case Elements.preformatted: return html`<pre ${attrs}>${children}</pre>`
    case Elements.strong: return html`<strong ${attrs}>${children}</strong>`
    case Elements.em: return html`<em ${attrs}>${children}</em>`
    case Elements.listItem:
    case Elements.oListItem: return html`<li ${attrs}>${children}</li>`
    case Elements.list: return html`<ul ${attrs}>${children}</ul>`
    case Elements.oList: return html`<ol ${attrs}>${children}</ol>`
    case Elements.image: return serializeImage(linkResolver, element)
    case Elements.embed: return serializeEmbed(element)
    case Elements.hyperlink: return serializeHyperlink(linkResolver, element, children)
    case Elements.label: return serializeLabel(element, children)
    case Elements.span: return serializeSpan(content)
    default: return null
  }
}

function serializeImage (linkResolver, element) {
  var img = html`<img src="${element.url}" alt="${element.alt || ''}" width="${element.dimensions.width}" height="${element.dimensions.height}">`
  var linkUrl = element.linkTo ? LinkHelper.url(element.linkTo, linkResolver) : null
  var attrs = { href: linkUrl }
  if (element.linkTo.target && element.linkTo.target === '_blank') {
    attrs.target = '_blank'
    attrs.rel = 'noopener noreferrer'
  }

  return html`
    <p class="${element.label || ''} block-img">
      ${linkUrl ? html`<a ${attrs}>${img}</a>` : img}
    </p>
  `
}

function serializeEmbed (element) {
  var attrs = {}
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
  var attrs = { href: LinkHelper.url(element.data, linkResolver) }
  if (element.data.target && element.data.target === '_blank') {
    attrs.target = '_blank'
    attrs.rel = 'noopener noreferrer'
  }
  return html`<a ${attrs}>${children}</a>`
}

function serializeLabel (element, children) {
  var attrs = {}
  if (element.data.label) attrs.class = element.data.label
  return html`<span ${attrs}>${children}</span>`
}

function serializeSpan (content) {
  return content.split('\n').reduce(function (parts, part, index, list) {
    parts.push(part)
    if (index !== 0 && index < list.length - 1) parts.push(html`<br>`)
    return parts
  }, [])
}

function asElement (richText, linkResolver, serializer) {
  var element = PrismicRichText.serialize(richText, serialize.bind(null, linkResolver), serializer)
  if (element.length === 1) return element[0]
  return element
}
