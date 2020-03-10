const noErr = prom => prom.catch(e => {
  // eslint-disable-next-line no-console
  console.error('Hanlded Error:', e);
});

const dateString = date => {
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const hour = `${date.getHours() % 12 || 12} ${date.getHours() < 12 ? 'am' : 'pm'}`;
  return `${day}, ${date.toLocaleDateString()}, ${hour}`;
};

export default ({ events, db, dom, notification }) => {
  const elem = document.querySelector('#main');
  let FOCUS_ID;

  const deleteCard = async (card, id) => {
    card.remove();
    noErr(db.remove({ id }));
    events.emit('render-complete');
  };

  const renderDate = remindAt => remindAt ?
    dom.classname(dom.span(dateString(new Date(remindAt))), 'date') :
    dom.nill();

  const renderField = field => {
    if (!field) {
      return dom.nill();
    }

    return dom.fragment(
      ...field.split('\n').map(i => i.trim()).map(line => {
        const urls = line.match(/[a-z]+:\/\/[^ ]+/ig);

        if (!urls) {
          return dom.p(line);
        }

        const lineElements = [];
        let tempLine = line;

        for (let url of urls) {
          const [before, ...rest] = tempLine.split(url);

          lineElements.push(dom.span(before));
          lineElements.push(dom.link(url, url));
          tempLine = rest.join(url);
        }

        if (tempLine) {
          lineElements.push(dom.span(tempLine));
        }

        return dom.children(
          dom.p(),
          dom.fragment(...lineElements)
        );
      })
    );
  };

  const renderNote = ({ title, text, url }) => {
    return dom.fragment(
      title ? dom.children(dom.div('title'), renderField(title)) : dom.nill(),
      text ? dom.children(dom.div('text'), renderField(text)) : dom.nill(),
      url ? dom.children(dom.div('text'), renderField(url)) : dom.nill(),
    );
  };

  const renderFile = ({ filebuffer, filename, filetype }) => {
    return dom.fragment(
      dom.img(new Blob([filebuffer])),
      dom.children(
        dom.div('text'),
        dom.text(`${filename} (${filetype})`)
      )
    );
  };

  const getCards = () => [].slice.call(document.querySelectorAll('.card'))
    .map(card => {
      return {
        card, id: Number(card.getAttribute('data-id'))
      };
    });

  const applyCardFocus = () => {
    getCards().forEach(({ card, id }) => {
      if (id !== FOCUS_ID) {
        return void card.classList.remove('focused');
      }

      card.classList.add('focused');
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  };

  const onRender = async () => {
    const cards = getCards();

    let currentCard;

    await db.each(null, record => {
      const idx = cards.findIndex(c => c.id === record.id);
      const isFile = 'filebuffer' in record;

      if (idx !== -1) {
        currentCard = cards[idx];
        return;
      }

      const card = dom.props(dom.div('card'), {
        'data-id': record.id
      });

      dom.children(
        card,
        isFile ? renderFile(record) : renderNote(record),
        dom.children(
          dom.div('buttons'),
          renderDate(record.remindAt),
          dom.click(dom.icon('notifications_active'), async (e) => {
            e.stopPropagation();
            await notification.show(record);
          }),
          navigator.share && !isFile ? dom.click(dom.icon('share'), async (e) => {
            e.stopPropagation();

            const data = {};
            record.title && (data.title = record.title);
            record.text && (data.text = record.text);
            record.url && (data.url = record.url);

            await noErr(navigator.share(data));
          }) : dom.nill(),
          dom.click(dom.icon('delete'), () => {
            deleteCard(card, record.id);
          })
        )
      );

      dom.children(card, dom.div('focus-inset'));

      if (currentCard) {
        elem.insertBefore(card, currentCard.card);
      } else {
        elem.insertBefore(card, elem.firstChild);
      }
    });

    applyCardFocus();

    events.emit('render-complete');
  };

  const onRenderFocus = ({ id }) => {
    FOCUS_ID = id;
    applyCardFocus();
  };

  events.on('render', onRender);
  events.on('render-focus', onRenderFocus);

  return () => {
    events.off('render', onRender);
    events.off('render-focus', onRenderFocus);
  };
};
