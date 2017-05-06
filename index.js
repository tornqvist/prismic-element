const html = require('bel');
const document = require('global/document');
const { createElement } = html;

const TAG_NAMES = {
  'heading1': 'h1',
  'heading2': 'h2',
  'heading3': 'h3',
  'heading4': 'h4',
  'heading5': 'h5',
  'heading6': 'h6',
  'paragraph': 'p',
  'preformatted': 'pre',
  'list-item': 'li',
  'o-list-item': 'li',
  'group-list-item': 'ul',
  'group-o-list-item': 'ol',
  'strong': 'strong',
  'em': 'em'
};

module.exports = function extend(Prismic) {
  const { Fragments } = Prismic;

  Fragments.Text.prototype.asElement = function () {
    return html`<span>${ this.value }</span>`;
  };

  Fragments.DocumentLink.prototype.asElement = function (ctx) {
    return html`<a href=${ this.url(ctx) }>${ this.url(ctx) }</a>`;
  };

  Fragments.WebLink.prototype.asElement = function () {
    return html`<a href=${ this.url() }>${ this.url() }</a>`;
  };

  Fragments.FileLink.prototype.asElement = function () {
    return html`<a href=${ this.url() }>${ this.value.file.name }</a>`;
  };

  Fragments.ImageLink.prototype.asElement = function () {
    return html`
      <a href=${ this.url }>
        <img src=${ this.url() } alt=${ this.alt || null } copyright=${ this.copyright || null } />
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
    return html(this.value.oembed.html);
  };

  Fragments.Image.prototype.asElement = function () {
    this.main.asElement();
  };

  Fragments.ImageView.prototype.asElement = function () {
    return html`<img src=${ this.url } width=${ this.width } height=${ this.height } alt=${ this.alt || null } copyright=${ this.copyright || null } />`;
  };

  Fragments.Separator.prototype.asElement = function () {
    return html`<hr />`;
  };

  Fragments.Group.prototype.asElement = function (linkResolver) {
    return this.value.map(value => value.asElement(linkResolver));
  };

  Fragments.SimpleSlice.prototype.asElement = function (linkResolver) {
    const classes = ['slice'];

    if (this.label) {
      classes.push(this.label);
    }

    return html`
      <div data-slicetype=${ this.sliceType } class=${ classes.join(' ') }>
        ${ this.value.asElement(linkResolver) }
      </div>
    `;
  };

  Fragments.CompositeSlice.prototype.asElement = function (linkResolver) {
    const classes = ['slice'];

    if (this.label) {
      classes.push(this.label);
    }

    return html`
      <div data-slicetype=${ this.sliceType } class=${ classes.join(' ') }>
        ${ Object.keys(this.nonRepeat).map(key => this.nonRepeat[key].asElement(linkResolver)) }
        ${ this.repeat.asElement(linkResolver) }
      </div>`;
  };

  Fragments.SliceZone.prototype.asElement = function (linkResolver) {
    return this.value.map(value => value.asElement(linkResolver));
  };

  /**
   * Logics pretty much identical to `Fragments.StructuredText.prototype.asHtml`
   * only that it returns an array of DOM elements
   */

  Fragments.StructuredText.prototype.asElement = function (linkResolver) {
    let group;
    const groups = [];

    if (!Array.isArray(this.blocks)) {
      return [];
    }

    if (typeof linkResolver !== 'function' && typeof linkResolver === 'object') {
      // Backward compatibility with the old ctx argument
      const ctx = linkResolver;
      linkResolver = (doc, isBroken) => ctx.linkResolver(ctx, doc, isBroken);
    }

    for (const block of this.blocks) {
      // Resolve image links
      if (block.type == 'image' && block.linkTo) {
        const link = Fragments.initField(block.linkTo);
        block.linkUrl = link.url(linkResolver);
      }

      if (block.type !== 'list-item' && block.type !== 'o-list-item') {
        // it's not a type that groups
        groups.push(block);
        group = null;
      } else if (!group || group.type !== `group-${ block.type }`) {
        // it's a new type or no BlockGroup was set so far
        group = {
          type: `group-${ block.type }`,
          blocks: [block]
        };
        groups.push(group);
      } else {
        // it's the same type as before, no touching group
        group.blocks.push(block);
      }
    }

    function blockContent(block) {
      if (block.blocks) {
        return block.blocks.map(block => asElement(block, blockContent(block)));
      }

      return insertSpans(block.text, block.spans, linkResolver);
    }

    return groups.map(group => asElement(group, blockContent(group)));
  };

  function insertSpans(text, spans, linkResolver) {
    if (!spans || !spans.length) {
      return document.createTextNode(text);
    }

    const start = {};
    const end = {};

    for (const span of spans) {
      if (!start[span.start]) { start[span.start] = []; }
      if (!end[span.end]) { end[span.end] = []; }

      start[span.start].push(Object.assign({}, span));
      end[span.end].unshift(Object.assign({}, span));
    }

    /**
     * Sort bigger tags first to ensure the correct tag hierarchy
     */

    Object.keys(start).forEach(key => {
      start[key].sort((a, b) => (b.end - b.start) - (a.end - a.start));
    });

    let top = 0;
    let content = '';
    const html = [];
    const stack = [];

    for (let i = 0, len = text.length + 1; i < len; i += 1) {
      if (end[i]) {
        end[i].forEach(close);
      }

      if (start[i]) {
        if (content.length) {
          if (stack[top]) {
            stack[top].appendChild(document.createTextNode(content));
          } else {
            html.push(document.createTextNode(content));
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
      html.push(document.createTextNode(content));
    }

    return html;

    /**
     * Remove span element from stack and add to parent
     */

    function close() {
      const element = stack.pop();

      element.appendChild(document.createTextNode(content));
      content = '';

      if (top === 0) {
        // The tag was top level
        html.push(element);
      } else {
        // Add the content to the parent tag
        top -= 1;
        stack[top].appendChild(element);
      }
    }

    /**
     * Add span element to stack
     */

    function open(span) {
      if (span.type === 'hyperlink') {
        const fragment = Fragments.initField(span.data);

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

      top = stack.push(asElement(span)) - 1;
    }
  }

  function asElement(element, content) {
    if (TAG_NAMES[element.type]) {
      const tag = TAG_NAMES[element.type];
      const props = {};

      if (element.label) {
        props.className = element.label;
      }

      let children = content;
      if (typeof children === 'string') {
        children = [document.createTextNode(children)];
      } else if (!Array.isArray(children)) {
        children = [children];
      }

      return createElement(tag, props, children);
    }

    if (element.type === 'image') {
      const image = createElement('img', {
        src: element.url,
        alt: element.alt || null,
        copyright: element.copyright || null
      });

      const children = [];
      if (element.linkUrl) {
        children.push(createElement('a', { href: element.linkUrl }, [ image ]));
      } else {
        children.push(image);
      }

      const classNames = ['block-img'];
      if (element.label) {
        classNames.push(element.label);
      }

      return createElement('p', { className: classNames.join(' ') }, children);
    }

    if (element.type === 'embed') {
      const props = {
        'data-oembed': element.embed_url,
        'data-oembed-type': element.type,
        'data-oembed-provider': element.provider.name
      };

      if (element.label) {
        props.className = element.label;
      }

      const oembed = createElement('div', props);

      /**
       * This is fuggly and kinda insecure – YOLO
       */

      oembed.innerHTML = element.oembed.html;

      return oembed;
    }

    if (element.type === 'hyperlink') {
      return html`<a href=${ element.url }>${ content }</a>`;
    }

    if (element.type === 'label') {
      return html`<span class=${ element.data.label }>${ content }</span>`;
    }

    return html`
      <div>
        <!-- Warning: "${ element.type }" not implemented. Upgrade the Developer Kit. -->
        ${ content }
      </div>
    `;
  }
};
