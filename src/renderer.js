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

const createText = text => document.createTextNode(text);

const createLink = (url, text) => {
  const a = document.createElement('a');
  a.href = url;
  a.appendChild(createText(text || url));

  return a;
};

export default ({ events, db }) => {
  const elem = document.querySelector('#main');

  const renderFile = ({ id, file }) => {
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

  const renderPlain = ({ id, title, text, url }) => {
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

  const onRender = async () => {
    await db.each(null, record => {
      if (record.file) {
        renderFile(record);
      } else {
        renderPlain(record);
      }
    });
  };

  events.on('render', onRender);

  return () => {
    events.on('render', onRender);
  };
};
