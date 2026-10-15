// Локальный просмотрщик экранов *.dc.html вне холста Claude Design.
// Понимает то, что используют макеты: <helmet>, класс Component extends DCLogic
// с renderVals()/setState(), {{путь}} в тексте и атрибутах, <sc-for list as>,
// <sc-if value>, onClick="{{функция}}".
(function () {
  class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(patch) { Object.assign(this.state, patch); if (this.__render) this.__render(); }
    renderVals() { return {}; }
  }
  window.DCLogic = DCLogic;

  const ONE = /^\s*\{\{([^}]+)\}\}\s*$/;
  const ANY = /\{\{([^}]+)\}\}/g;

  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), scope);
  }
  function fill(text, scope) {
    return text.replace(ANY, (_, p) => { const v = lookup(scope, p); return v == null ? '' : String(v); });
  }
  function bound(attr, scope) {
    const m = ONE.exec(attr || '');
    return m ? lookup(scope, m[1]) : undefined;
  }

  function render(node, scope, out) {
    if (node.nodeType === Node.TEXT_NODE) { out.appendChild(document.createTextNode(fill(node.nodeValue, scope))); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.localName;
    if (tag === 'sc-for') {
      const list = bound(node.getAttribute('list'), scope) || [];
      const as = node.getAttribute('as') || 'item';
      list.forEach((item) => {
        const inner = Object.create(scope);
        inner[as] = item;
        node.childNodes.forEach((c) => render(c, inner, out));
      });
      return;
    }
    if (tag === 'sc-if') {
      if (bound(node.getAttribute('value'), scope)) node.childNodes.forEach((c) => render(c, scope, out));
      return;
    }
    const el = document.createElementNS(node.namespaceURI, node.localName);
    for (const a of Array.from(node.attributes)) {
      if (/^on[a-z]+$/i.test(a.name) && ONE.test(a.value)) {
        const fn = bound(a.value, scope);
        if (typeof fn === 'function') el.addEventListener(a.name.slice(2).toLowerCase(), fn);
        continue;
      }
      if (a.name.startsWith('hint-')) continue;
      el.setAttribute(a.name, fill(a.value, scope));
    }
    const kids = node.localName === 'template' ? node.content.childNodes : node.childNodes;
    kids.forEach((c) => render(c, scope, el));
    out.appendChild(el);
  }

  function boot() {
    const root = document.querySelector('x-dc');
    if (!root) return;
    const helmet = root.querySelector('helmet');
    if (helmet) { Array.from(helmet.childNodes).forEach((n) => document.head.appendChild(n)); helmet.remove(); }
    const script = document.querySelector('script[data-dc-script]');
    let Component = DCLogic;
    if (script) Component = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
    const template = Array.from(root.childNodes);
    root.remove();
    const host = document.createElement('div');
    host.className = 'dc-host';
    document.body.appendChild(host);
    const instance = new Component({});
    instance.__render = () => {
      const scope = instance.renderVals() || {};
      const frag = document.createDocumentFragment();
      template.forEach((n) => render(n, scope, frag));
      host.replaceChildren(frag);
    };
    instance.__render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
