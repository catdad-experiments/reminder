const isUrl = text => /^https?:\/\/.+/.test(text);

export default ({ events, db, dom }) => {
  const elem = document.querySelector('#main');

  const renderFile = (card, { filebuffer, filename, filetype, filesize }) => {
    dom.children(
      card,
      dom.children(dom.div(), dom.text(`file name: ${filename}`)),
      dom.children(dom.div(), dom.text(`file type: ${filetype}`)),
      dom.children(dom.div(), dom.text(`file size: ${filesize}`)),
      dom.img(new Blob([filebuffer]))
    );
  };

  const renderPlain = (card, { id, title, text, url }) => {
    dom.children(
      card,
      dom.children(
        dom.div(),
        dom.text(`${id} title: `),
        isUrl(title) ? dom.link(title, title) : dom.text(`${title}`)
      ),
      dom.children(
        dom.div(),
        dom.text('text: '),
        isUrl(text) ? dom.link(text, text) : dom.text(`${text}`)
      ),
      dom.children(
        dom.div(),
        dom.text('url: '),
        isUrl(url) ? dom.link(url, url) : dom.text(`${url}`)
      )
    );
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
      const card = dom.props(dom.div('card'), {
        'data-id': record.id
      });

      const idx = cards.findIndex(c => c.id === record.id);

      if (idx !== -1) {
        currentCard = cards[idx];
        return;
      }

      if (record.filebuffer) {
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
