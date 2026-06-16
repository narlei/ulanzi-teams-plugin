
import WebSocket from 'ws';
import EventEmitter from 'events';

import { Events, SocketErrors } from "./constants.js";
import Utils from "./utils.js";


class UlanzideckApi extends EventEmitter {

  constructor() {
    super();
    this.key = '';
    this.uuid = '';
    this.actionid = '';
    this.websocket = null;
  }

  connect(uuid, port = 3906, address = '127.0.0.1') {
    const [ argv_address, argv_port ] = process.argv.splice(2);
    this.address = argv_address || address;
    this.port = argv_port || port;
    this.uuid = uuid;

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    const isMain = this.uuid.split('.').length == 4;

    this.websocket = new WebSocket(`ws://${this.address}:${this.port}`);

    this.websocket.onopen = () => {
      Utils.log('[ULANZIDECK] WEBSOCKET OPEN:', uuid);
      const json = { code: 0, cmd: Events.CONNECTED, uuid };
      this.websocket.send(JSON.stringify(json));
      this.emit(Events.CONNECTED, {});
    };

    this.websocket.onerror = (evt) => {
      const error = `[ULANZIDECK] WEBSOCKET ERROR: ${JSON.stringify(evt)}, ${SocketErrors[evt?.code || 'DEFAULT']}`;
      Utils.warn(error);
      this.emit(Events.ERROR, error);
    };

    this.websocket.onclose = (evt) => {
      Utils.warn('[ULANZIDECK] WEBSOCKET CLOSED:', SocketErrors[evt?.code || 'DEFAULT']);
      this.emit(Events.CLOSE);
    };

    this.websocket.onmessage = (evt) => {
      const data = evt?.data ? JSON.parse(evt.data) : null;
      if (!data || (typeof data.code !== 'undefined' && data.cmdType !== 'REQUEST')) return;

      if (!this.key && data.uuid == this.uuid && data.key) this.key = data.key;
      if (!this.actionid && data.uuid == this.uuid && data.actionid) this.actionid = data.actionid;

      if (isMain) {
        this.send(data.cmd, { code: 0, ...data });
      }

      if (data.cmd == 'clear') {
        if (data.param) {
          for (let i = 0; i < data.param.length; i++) {
            data.param[i].context = this.encodeContext(data.param[i]);
          }
        }
      } else {
        data.context = this.encodeContext(data);
      }

      this.emit(data.cmd, data);
    };
  }

  encodeContext(jsn) {
    return jsn.uuid + '___' + jsn.key + '___' + jsn.actionid;
  }

  decodeContext(context) {
    const de_ctx = context.split('___');
    return { uuid: de_ctx[0], key: de_ctx[1], actionid: de_ctx[2] };
  }

  send(cmd, params) {
    this.websocket && this.websocket.send(JSON.stringify({
      cmd,
      uuid: this.uuid,
      key: this.key,
      actionid: this.actionid,
      ...params
    }));
  }

  sendParamFromPlugin(settings, context) {
    const { uuid, key, actionid } = context ? this.decodeContext(context) : {};
    this.send(Events.PARAMFROMPLUGIN, {
      uuid: uuid || this.uuid,
      key: key || this.key,
      actionid: actionid || this.actionid,
      param: settings
    });
  }

  openUrl(url, local) {
    this.send(Events.OPENURL, { url, local: local ? true : false });
  }

  toast(msg) {
    this.send(Events.TOAST, { msg });
  }

  setStateIcon(context, state, text) {
    const { uuid, key, actionid } = this.decodeContext(context);
    this.send(Events.STATE, {
      param: {
        statelist: [{ uuid, key, actionid, type: 0, state, textData: text || '', showtext: text ? true : false }]
      }
    });
  }

  onConnected(fn) { this.on(Events.CONNECTED, (jsn) => fn(jsn)); return this; }
  onClose(fn)     { this.on(Events.CLOSE,     (jsn) => fn(jsn)); return this; }
  onError(fn)     { this.on(Events.ERROR,     (jsn) => fn(jsn)); return this; }
  onAdd(fn)       { this.on(Events.ADD,       (jsn) => fn(jsn)); return this; }
  onParamFromApp(fn)    { this.on(Events.PARAMFROMAPP,    (jsn) => fn(jsn)); return this; }
  onParamFromPlugin(fn) { this.on(Events.PARAMFROMPLUGIN, (jsn) => fn(jsn)); return this; }
  onRun(fn)       { this.on(Events.RUN,       (jsn) => fn(jsn)); return this; }
  onSetActive(fn) { this.on(Events.SETACTIVE, (jsn) => fn(jsn)); return this; }
  onClear(fn)     { this.on(Events.CLEAR,     (jsn) => fn(jsn)); return this; }
}

export default UlanzideckApi;
