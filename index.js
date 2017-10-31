var html = require('bel');
var raw = require('bel/raw');
var PrismicRichText = require('prismic-richtext');
var LinkHelper = require('prismic-helpers').Link;

var Elements = PrismicRichText.Elements;

function serialize(linkResolver, type, element, content, children) {
  var className = element.label || '';

  switch(type) {
    case Elements.heading1: return html`<h1 class="${ className }">${ children }</h1>`;
    case Elements.heading2: return html`<h2 class="${ className }">${ children }</h2>`;
    case Elements.heading3: return html`<h3 class="${ className }">${ children }</h3>`;
    case Elements.heading4: return html`<h4 class="${ className }">${ children }</h4>`;
    case Elements.heading5: return html`<h5 class="${ className }">${ children }</h5>`;
    case Elements.heading6: return html`<h6 class="${ className }">${ children }</h6>`;
    case Elements.paragraph: return html`<p class="${ className }">${ children }</p>`;
    case Elements.preformatted: return html`<pre class="${ className }">${ children }</pre>`;
    case Elements.strong: return html`<strong class="${ className }">${ children }</strong>`;
    case Elements.em: return html`<em class="${ className }">${ children }</em>`;
    case Elements.listItem:
    case Elements.oListItem: return html`<li class="${ className }">${ children }</li>`;
    case Elements.list: return html`<ul class="${ className }">${ children }</ul>`;
    case Elements.oList: return html`<ol class="${ className }">${ children }</ol>`;
    case Elements.image: return serializeImage(linkResolver, element);
    case Elements.embed: return serializeEmbed(element);
    case Elements.hyperlink: return serializeHyperlink(linkResolver, element, children);
    case Elements.label: return serializeLabel(element, children);
    case Elements.span: {
      if (!content || content.indexOf('\n') === -1) {
        return content;
      }

      return raw(content.replace(/\n/g, '<br />'));
    }
    default: return null;
  }
}

function serializeImage(linkResolver, element) {
  var linkUrl = element.linkTo ? LinkHelper.url(element.linkTo, linkResolver) : '';
  var wrapperClassList = [ element.label || '', 'block-img' ];
  var img = html`<img src="${ element.url }" alt="${ element.alt || '' }" copyright="${ element.copyright || '' }">`;

  return html`
    <p class="${ wrapperClassList.join(' ') }">
      ${ linkUrl ? html`<a href="${ linkUrl }">${ img }</a>` : img }
    </p>
  `;
}

function serializeEmbed(element) {
  return html`
    <div data-oembed="${ element.embed_url || '' }" data-oembed-type="${ element.type || '' }" data-oembed-provider="${ element.provider_name || '' }" class="${ element.label || '' }">
      ${ raw(element.oembed.html) }
    </div>
  `;
}

function serializeHyperlink(linkResolver, element, children) {
  return html`<a href="${ LinkHelper.url(element.data, linkResolver) }">${ children }</a>`;
}

function serializeLabel(element, children) {
  return html`<span class="${ element.data.label || '' }">${ children }</span>`;
}

module.exports = function asElement(richText, linkResolver, serializer) {
  var element = PrismicRichText.serialize(richText, serialize.bind(null, linkResolver), serializer);

  if (element.length === 1) {
    return element[0];
  }

  return element;
};
