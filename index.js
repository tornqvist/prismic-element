var html = require('bel');

var TAG_NAMES = [
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
  'paragraph',
  'preformatted',
  'list-item',
  'o-list-item',
  'group-list-item',
  'group-o-list-item',
  'strong',
  'em'
];

module.exports = function extend(Prismic) {
  var Fragments = Prismic.Fragments;

  Fragments.Text.prototype.asElement = function () {
    return html`<span>${ this.value }</span>`;
  };

  Fragments.DocumentLink.prototype.asElement = function (ctx) {
    return html`<a href="${ this.url(ctx) }">${ this.url(ctx) }</a>`;
  };

  Fragments.WebLink.prototype.asElement = function () {
    return html`<a href="${ this.url() }">${ this.url() }</a>`;
  };

  Fragments.FileLink.prototype.asElement = function () {
    return html`<a href="${ this.url() }">${ this.value.file.name }</a>`;
  };

  Fragments.ImageLink.prototype.asElement = function () {
    return html`
      <a href=${ this.url }>
        <img src="${ this.url() }" alt="${ this.alt || null }" copyright="${ this.copyright || null }" />
      </a>
    `;
  };

  Fragments.Select.prototype.asElement = function () {
    return html`<span>${ this.value }</span>`;
  };

  Fragments.Color.prototype.asElement = function () {
    return html`<span>${ this.value }</span>`;
  };

  Fragments.GeoPoint.prototype.asElement = function () {
    return html`
      <div class="geopiont">
        <span class="latitude">${ this.latitude }</span>
        <span class="longitude">${ this.longitude }</span>
      </div>
    `;
  };

  Fragments.Number.prototype.asElement = function () {
    return html`<span>${ this.value }</span>`;
  };

  Fragments.Date.prototype.asElement = function () {
    return html`<time>${ this.value }</time>`;
  };

  Fragments.Timestamp.prototype.asElement = function () {
    return html`<time>${ this.value }</time>`;
  };

  Fragments.Embed.prototype.asElement = function () {
    return html([this.value.oembed.html]);
  };

  Fragments.Image.prototype.asElement = function () {
    this.main.asElement();
  };

  Fragments.ImageView.prototype.asElement = function () {
    return html`<img src="${ this.url }" width="${ this.width }" height="${ this.height }" alt="${ this.alt || null }" copyright="${ this.copyright || null }" />`;
  };

  Fragments.Separator.prototype.asElement = function () {
    return html`<hr />`;
  };

  Fragments.Group.prototype.asElement = function (linkResolver) {
    return this.value.map(function (value) {
      return value.asElement(linkResolver);
    });
  };

  Fragments.SimpleSlice.prototype.asElement = function (linkResolver) {
    var classes = ['slice'];

    if (this.label) {
      classes.push(this.label);
    }

    return html`
      <div data-slicetype="${ this.sliceType }" class="${ classes.join(' ') }">
        ${ this.value.asElement(linkResolver) }
      </div>
    `;
  };

  Fragments.CompositeSlice.prototype.asElement = function (linkResolver) {
    var classes = ['slice'];

    if (this.label) {
      classes.push(this.label);
    }

    return html`
      <div data-slicetype="${ this.sliceType }" class="${ classes.join(' ') }">
        ${ Object.keys(this.nonRepeat).map(function (key) {
          return this.nonRepeat[key].asElement(linkResolver);
        }) }
        ${ this.repeat.asElement(linkResolver) }
      </div>
    `;
  };

  Fragments.SliceZone.prototype.asElement = function (linkResolver) {
    return this.value.map(function (value) {
      return value.asElement(linkResolver);
    });
  };

  /**
   * Logics pretty much identical to `Fragments.StructuredText.prototype.asHtml`
   * only that it returns an array of DOM elements
   */

  Fragments.StructuredText.prototype.asElement = function (linkResolver) {
    var group;
    var groups = [];

    if (!Array.isArray(this.blocks)) {
      return [];
    }

    if (typeof linkResolver !== 'function' && typeof linkResolver === 'object') {
      // Backward compatibility with the old ctx argument
      var ctx = linkResolver;
      linkResolver = function (doc, isBroken) {
        return ctx.linkResolver(ctx, doc, isBroken);
      };
    }

    this.blocks.forEach(function (block) {
      var link;

      // Resolve image links
      if (block.type == 'image' && block.linkTo) {
        link = Fragments.initField(block.linkTo);
        block.linkUrl = link.url(linkResolver);
      }

      if (block.type !== 'list-item' && block.type !== 'o-list-item') {
        // it's not a type that groups
        groups.push(block);
        group = null;
      } else if (!group || group.type !== 'group-' + block.type) {
        // it's a new type or no BlockGroup was set so far
        group = {
          type: 'group-' + block.type,
          blocks: [block]
        };
        groups.push(group);
      } else {
        // it's the same type as before, no touching group
        group.blocks.push(block);
      }
    });

    function blockContent(block) {
      if (block.blocks) {
        return block.blocks.map(function (block) {
          return asElement(block, blockContent(block));
        });
      }

      return insertSpans(block.text, block.spans, linkResolver);
    }

    return groups.map(function (group) {
      return asElement(group, blockContent(group));
    });
  };

  function insertSpans(text, spans, linkResolver) {
    if (!spans || !spans.length) {
      return text;
    }

    var start = {};
    var end = {};
    var top = 0;
    var content = '';
    var html = [];
    var stack = [];

    spans.forEach(function (span) {
      if (!start[span.start]) { start[span.start] = []; }
      if (!end[span.end]) { end[span.end] = []; }

      var children = [];

      start[span.start].push(Object.assign({ children: children }, span));
      end[span.end].unshift(Object.assign({ children: children }, span));
    });

    /**
     * Sort longer tags first to ensure the correct tag hierarchy
     */

    Object.keys(start).forEach(function (key) {
      start[key].sort(function (a, b) {
        return (b.end - b.start) - (a.end - a.start);
      });
    });

    for (var i = 0, len = text.length + 1; i < len; i += 1) {
      if (end[i]) {
        end[i].forEach(close);
      }

      if (start[i]) {
        if (content.length) {
          if (stack[top]) {
            stack[top].children.push(content);
          } else {
            html.push(content);
          }

          content = '';
        }

        start[i].forEach(open);
      }

      if (text[i]) {
        content += text[i];
      }
    }

    /**
     * Add any trailing text
     */

    if (content.length) {
      html.push(content);
    }

    return html;

    /**
     * Remove span element from stack and add to parent
     */

    function close() {
      var props = stack.pop();
      var element = asElement(props, props.children.concat(content));

      content = '';

      if (top === 0) {
        // The tag was top level
        html.push(element);
      } else {
        // Add the content to the parent tag
        top -= 1;
        stack[top].children.push(element);
      }
    }

    /**
     * Add span element to stack
     */

    function open(span) {
      if (span.type === 'hyperlink') {
        var fragment = Fragments.initField(span.data);

        if (fragment) {
          span.url = fragment.url(linkResolver);
        } else {
          // eslint-disable-next-line no-console
          if (console && console.error) console.error('Impossible to convert span.data as a Fragment', span);
          return;
        }
      }

      /**
       * Add element to stack and save a reference to it's index (length - 1)
       */

      top = stack.push(span) - 1;
    }
  }

  function asElement(element, content) {
    var result;
    var children = [];
    var className = element.label || null;

    if (TAG_NAMES.indexOf(element.type) !== -1) {
      if (Array.isArray(content)) {
        children = content;
      } else if (typeof content !== 'undefined') {
        children.push(content);
      }

      switch (element.type) {
        case 'heading1': return html`
          <h1 class="${ className }">${ children }</h1>
        `;
        case 'heading2': return html`
          <h2 class="${ className }">${ children }</h2>
        `;
        case 'heading3': return html`
          <h3 class="${ className }">${ children }</h3>
        `;
        case 'heading4': return html`
          <h4 class="${ className }">${ children }</h4>
        `;
        case 'heading5': return html`
          <h5 class="${ className }">${ children }</h5>
        `;
        case 'heading6': return html`
          <h6 class="${ className }">${ children }</h6>
        `;
        case 'paragraph': return html`
          <p class="${ className }">${ children }</p>
        `;
        case 'preformatted': return html`
          <pre class="${ className }">${ children }</pre>
        `;
        case 'list-item': return html`
          <li class="${ className }">${ children }</li>
        `;
        case 'o-list-item': return html`
          <li class="${ className }">${ children }</li>
        `;
        case 'group-list-item': return html`
          <ul class="${ className }">${ children }</ul>
        `;
        case 'group-o-list-item': return html`
          <ol class="${ className }">${ children }</ol>
        `;
        case 'strong': return html`
          <strong class="${ className }">${ children }</strong>
        `;
        case 'em': return html`
          <em class="${ className }">${ children }</em>
        `;
        default: return html`
          <div>
            <!-- Warning: element type not implemented. Upgrade the Developer Kit. -->
            ${ content }
          </div>
        `;
      }
    }

    if (element.type === 'image') {
      children.push(html`
        <img src="${ element.url }" alt="${ element.alt || null }" copyright="${ element.copyright || null }" />
      `);

      if (element.linkUrl) {
        children = [
          html`<a href="${ element.linkUrl }">${ children.slice() }</a>`
        ];
      }

      className = (className || '') + 'block-img';

      return html`<p class="${ className }">${ children }</p>`;
    }

    if (element.type === 'embed') {

      /**
       * Take special care to avoid escaping HTML
       * @see pelo (https://github.com/shuhei/pelo/blob/master/index.js#L28)
       */

      if (typeof window === 'undefined') {
        children = new String(element.oembed.html);
        children.__encoded = true;
      } else {
        children = null;
      }

      result = html`
        <div data-oembed-type="embed" data-oembed="${ element.embed_url || null }" data-oembed-provider="${ element.provider.name || null }">
          ${ children }
        </div>
      `;

      /**
       * Dangerously set inner HTML
       */

      if (typeof window !== 'undefined') {
        result.innerHTML = element.oembed.html;
      }

      return result;
    }

    if (element.type === 'hyperlink') {
      return html`<a href="${ element.url }">${ content }</a>`;
    }

    if (element.type === 'label') {
      return html`<span class="${ element.data.label }">${ content }</span>`;
    }

    return html`
      <div>
        <!-- Warning: element type not implemented. Upgrade the Developer Kit. -->
        ${ content }
      </div>
    `;
  }
};
