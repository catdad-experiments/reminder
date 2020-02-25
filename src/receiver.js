const isUrl = text => /^https?:\/\/.+/.test(text);

const createElem = ({ tag = 'div', children = [], classname }) => {
  const el = document.createElement(tag);

  if (classname) {
    el.className = classname;
  }

  children.forEach(c => el.appendChild(c));

  return el;
};

const createText = text => document.createTextNode(text);

export default ({ events }) => {
  const elem = document.querySelector('#main');

  const handleFile = file => {

  };

  const onShare = ({ title, text, url, file }) => {
    if (file) {
      return handleFile(file);
    }

    elem.appendChild(createElem({
      classname: 'card',
      children: [ createText(`title: ${title}`) ]
    }));
    elem.appendChild(createElem({
      classname: 'card',
      children: [ createText(`text: ${text}`) ]
    }));
    elem.appendChild(createElem({
      classname: 'card',
      children: [ createText(`url: ${url}`) ]
    }));
  };

  events.on('receive-share', onShare);

  return () => {
    events.off('receive-share', onShare);
  };
};
