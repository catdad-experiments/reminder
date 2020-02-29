export const handle = (el, name, handler) => {
  el.addEventListener(name, handler, false);
  return el;
};

export const click = (el, handler) => handle(el, 'click', handler);

export const classname = (el, ...classes) => {
  classes.forEach(c => c && el.classList.add(c));
  return el;
};

export const props = (el, obj) => {
  for (let key in obj) {
    el.setAttribute(key, obj[key]);
  }

  return el;
};

export const children = (parent, ...elements) => {
  for (let elem of elements) {
    parent.appendChild(elem);
  }

  return parent;
};

export const empty = (elem) => {
  while (elem.firstChild) {
    elem.removeChild(elem.firstChild);
  }

  return elem;
};

export const fragment = (...elements) => children(document.createDocumentFragment(), ...elements);

export const elem = (tag) => document.createElement(tag);

export const text = (str) => document.createTextNode(str);

export const nill = () => text('');

export const div = (className) => classname(elem('div'), className);

export const p = (str) => children(elem('p'), typeof str === 'string' ? text(str) : nill());

export const span = (str) => children(elem('span'), typeof str === 'string' ? text(str) : nill());

export const h1 = (str) => children(elem('h1'), typeof str == 'string' ? text(str) : nill());

export const link = (str, href) => children(props(elem('a'), { href }), text(str));

export const button = (str, onClick) => click(children(elem('button'), text(str)), onClick);

export const img = (srcOrBlob) => Object.assign(elem('img'), {
  onload: ({ target }) => {
    if (srcOrBlob instanceof Blob) {
      URL.revokeObjectURL(target.src);
    }
  },
  src: (srcOrBlob instanceof Blob) ? URL.createObjectURL(srcOrBlob) : srcOrBlob
});
