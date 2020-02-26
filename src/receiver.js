const isUrl = text => /^https?:\/\/.+/.test(text);

const createElem = ({ tag = 'div', children = [], classname }) => {
  const el = document.createElement(tag);

  if (classname) {
    el.className = classname;
  }

  children.forEach(c => el.appendChild(c));

  return el;
};

const createImg = ({ file }) => {
  const url = URL.createObjectURL(file);
  const img = document.createElement('img');

  img.onload = () => {
    URL.revokeObjectURL(url);
  };

  img.src = url;

  return img;
};

const createLink = (url, text) => {
  const a = document.createElement('a');
  a.href = url;
  a.appendChild(createText(text || url));

  return a;
};

const createText = text => document.createTextNode(text);

export default ({ events }) => {
  const elem = document.querySelector('#main');

  const handleFile = file => {
    const card = createElem({ classname: 'card' });

    card.appendChild(createElem({
      children: [ createText(`file name: ${file.name}`) ]
    }));
    card.appendChild(createElem({
      children: [ createText(`file size: ${file.size}`) ]
    }));
    card.appendChild(createElem({
      children: [ createText(`file type: ${file.type}`) ]
    }));

    card.appendChild(createImg({ file }));

    elem.appendChild(card);
  };

  const onShare = ({ title, text, url, file }) => {
    if (file) {
      return handleFile(file);
    }

    const card = createElem({ classname: 'card' });

    card.appendChild(createElem({
      children: [
        createText('title: '),
        isUrl(title) ? createLink(title) : createText(`${title}`)
      ]
    }));
    card.appendChild(createElem({
      children: [
        createText('text: '),
        isUrl(text) ? createLink(text) : createText(`${text}`)
      ]
    }));
    card.appendChild(createElem({
      children: [
        createText('url: '),
        isUrl(url) ? createLink(url) : createText(`${url}`)
      ]
    }));

    elem.appendChild(card);
  };

  events.on('receive-share', onShare);

  return () => {
    events.off('receive-share', onShare);
  };
};
