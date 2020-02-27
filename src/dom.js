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

const children = (el, ...childs) => {
  for (let child of childs) {
    el.appendChild(child);
  }

  return el;
};

const empty = (elem) => {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }
  return elem;
};

const fragment = (...childs) => children(document.createDocumentFragment(), ...childs);

const elem = (tag) => document.createElement(tag);

const text = (str) => document.createTextNode(str);

const nill = () => text('');

const div = (className) => classname(elem('div'), className);

const p = (str) => {
  const el = elem('p');

  if (str !== undefined) {
    el.appendChild(text(str));
  }

  return el;
};

const span = (str) => children(elem('span'), text(str || ''));

const h1 = (str) => children(elem('h1'), text(str));

const link = (str, href) => children(props(elem('a'), { href }), text(str));

const linkBlock = (className, str, href) => children(div(className), link(str, href));

const button = (str, onClick) => click(children(elem('button'), text(str)), onClick);

const img = (srcOrBlob) => {
  const el = elem('img');
  const isBlob = (srcOrBlob instanceof Blob);
  const url = isBlob ? URL.createObjectURL(srcOrBlob) : srcOrBlob;

  el.onload = () => {
    if (isBlob) {
      URL.revokeObjectURL(url);
    }
  };

  el.src = url;

  return el;
};

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
  linkBlock,
  button,
  img,
  props,
  classname,
  children,
  handle,
  click,
  empty
};
