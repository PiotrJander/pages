/* widgets.js — prymitywy prezentacji. Zero wiedzy o szafie.
   Tu mieszka wiązanie htm↔preact, więc reszta aplikacji importuje `html` stąd
   i nie powstaje cykl ui.js ↔ plan.js. */
import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import htm from 'htm';

export const html = htm.bind(h);

/* Liczba? → wyrównaj do prawej. Napis z HTML-em → wstrzyknij. Inaczej → dziecko. */
const cell = (c, i) => {
  const isStr = typeof c === 'string';
  const num = isStr && c !== '' && !isNaN(parseFloat(c));
  const cls = i === 0 ? 'a' : (num ? 'n' : '');
  return isStr
    ? html`<td class=${cls} dangerouslySetInnerHTML=${{ __html: c }} />`
    : html`<td class=${cls}>${c}</td>`;
};

export const Table = ({ head, rows, cls }) => html`
  <table class=${cls}>
    ${head && html`<tr>${head.map(x => html`<th>${x}</th>`)}</tr>`}
    ${rows.map(r => html`<tr>${r.map(cell)}</tr>`)}
  </table>`;

export const Check = ({ label, checked, onInput }) => html`
  <label class="chk"><input type="checkbox" checked=${checked}
    onInput=${e => onInput(e.target.checked)} /> ${label}</label>`;

export const Pad = ({ on }) => html`
  <div class="pad">
    <button onClick=${() => on(0, 1)} aria-label="w górę">↑</button>
    <button onClick=${() => on(-1, 0)} aria-label="w lewo">←</button>
    <button onClick=${() => on('c')} aria-label="wyśrodkuj">⊙</button>
    <button onClick=${() => on(1, 0)} aria-label="w prawo">→</button>
    <button onClick=${() => on(0, -1)} aria-label="w dół">↓</button>
  </div>`;

/* <dialog> sterowany propsem `open`; kliknięcie w tło zamyka. */
export function Dialog({ open, onClose, children, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return html`<dialog ref=${ref} class=${wide ? 'wide' : ''} onClose=${onClose}
    onClick=${e => { if (e.target === ref.current) onClose(); }}>
    <div class="dlg">${children}</div></dialog>`;
}

export function CopyBox({ text, label = 'Skopiuj', rows = 10, onLoad }) {
  const [msg, setMsg] = useState('');
  const [val, setVal] = useState(text);
  useEffect(() => { setVal(text); setMsg(''); }, [text]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(val); setMsg('Skopiowane do schowka.'); }
    catch { setMsg('Schowek niedostępny – zaznacz tekst i skopiuj ręcznie.'); }
  };
  return html`<div>
    <textarea style=${{ height: (rows * 22) + 'px' }} spellcheck="false" value=${val}
      onInput=${e => setVal(e.target.value)} />
    <div class="btns"><button onClick=${copy}>${label}</button>
      ${onLoad && html`<button onClick=${() => setMsg(onLoad(val))}>Wczytaj z pola</button>`}</div>
    ${msg && html`<p class="note">${msg}</p>`}
  </div>`;
}
