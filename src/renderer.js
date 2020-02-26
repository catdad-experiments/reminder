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

  const renderFile = (card, { file }) => {
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
  };

  const renderPlain = (card, { id, title, text, url }) => {
    card.appendChild(createElem({
      children: [
        createText(`${id} title: `),
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
  };

  const onRender = async () => {
    const cards = [].slice.call(document.querySelectorAll('.card'))
      .map(card => {
        return {
          card, id: Number(card.getAttribute('data-id'))
        };
      });

    let currentCard;

    await db.each(null, record => {
      const card = createElem({ classname: 'card' });
      card.setAttribute('data-id', record.id);

      const idx = cards.findIndex(c => c.id === record.id);

      if (idx !== -1) {
        currentCard = cards[idx];
        return;
      }

      if (record.file) {
        renderFile(card, record);
      } else {
        renderPlain(card, record);
      }

      if (currentCard) {
        elem.insertBefore(card, currentCard.card);
      } else {
        elem.insertBefore(card, elem.firstChild);
      }
    });
  };

  events.on('render', onRender);

  return () => {
    events.on('render', onRender);
  };
};
