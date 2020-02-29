const handle = (el, name, handler) => {
  el.addEventListener(name, handler, false);
  return el;
};

const click = (el, handler) => handle(el, 'click', handler);

const classname = (el, ...classes) => {
  classes.forEach(c => c && el.classList.add(c));
  return el;
};

const props = (el, obj) => {
  for (let key in obj) {
    el.setAttribute(key, obj[key]);
  }

  return el;
};

const children = (parent, ...elements) => {
  for (let elem of elements) {
    parent.appendChild(elem);
  }

  return parent;
};

const empty = (elem) => {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }

  return elem;
};

const fragment = (...elements) => children(document.createDocumentFragment(), ...elements);

const elem = (tag) => document.createElement(tag);

const text = (str) => document.createTextNode(str);

const nill = () => text('');

const div = (className) => classname(elem('div'), className);

const p = (str) => children(elem('p'), typeof str === 'string' ? text(str) : nill());

const span = (str) => children(elem('span'), typeof str === 'string' ? text(str) : nill());

const h1 = (str) => children(elem('h1'), typeof str == 'string' ? text(str) : nill());

const link = (str, href) => children(props(elem('a'), { href }), text(str));

const button = (str, onClick) => click(children(elem('button'), text(str)), onClick);

const img = (srcOrBlob) => Object.assign(elem('img'), {
  onload: ({ target }) => {
    if (srcOrBlob instanceof Blob) {
      URL.revokeObjectURL(target.src);
    }
  },
  src: (srcOrBlob instanceof Blob) ? URL.createObjectURL(srcOrBlob) : srcOrBlob
});

export default {
  elem,
  nill,
  fragment,
  text,
  div,
  p,
  span,
  h1,
  link,
  button,
  img,
  props,
  classname,
  children,
  handle,
  click,
  empty
};
