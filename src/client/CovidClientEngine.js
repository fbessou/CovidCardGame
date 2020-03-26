import { ClientEngine, KeyboardControls } from 'lance-gg';
import CovidRenderer from '../client/CovidRenderer';
import Card from '../common/Card';
import PrivateArea from '../common/PrivateArea';


export default class CovidClientEngine extends ClientEngine {

  constructor(gameEngine, options) {
    super(gameEngine, options, CovidRenderer);
    this.privateAreaId = null;
    this.side = PrivateArea.SIDE.SOUTH;
    this.callbacks = new Map();
    this.callbacks.set("table_side_changed", [])
    this.callbacks.set("private_area_entered", [])
    this.callbacks.set("private_area_exited", [])
    gameEngine.on('renderer.ready', this.bindKeys.bind(this));
  }

  start() {
    this.bindKeys();
    this.updateInputName();
    return super.start();
  }

  bindKeys() {
    this.keyDownListener = this.keyDownListener || this.onKeyDown.bind(this);
    document.body.addEventListener("keydown", this.keyDownListener);
  }

  unbindKeys() {
    document.body.removeEventListener("keydown", this.keyDownListener);
  }

  onKeyDown(e) {
    let ids = this.renderer.selection;
    if (e.key === "m") {
      if (ids.length > 1)
        this.sendInput("randomize " + ids.toString());
    } else if (e.key === "a" && (event.ctrlKey || event.metaKey)) {
      e.preventDefault();
      let sel = [];
      let cards = this.gameEngine.world.queryObjects({ instanceType: Card });
      cards.forEach((c) => { sel.push(c.id); });
      this.renderer.selection = sel;
    } else if (e.key === "g") {
      if (ids.length > 1)
        this.sendInput("gather " + this.side + " " + ids.toString());
    } else if (e.key === "Escape") {
      this.privateArea = null;
    }
  }

  // return the content in the text box
  updateInputName() {
    let playerName;
    const input = document.querySelector('#nameInput');
    if (this.hasPrivateArea) {
      input.parentElement.style.visibility = "hidden";
      this.bindKeys();
      playerName = input.value;
    } else {
      input.parentElement.style.visibility = "visible";
      input.select();
      this.unbindKeys();
    }
    return playerName;
  }

  on(eventName, func) {
    const fs = this.callbacks.get(eventName);
    if (fs === undefined)
      console.error("Unkown event: \""+eventName+"\"");
    else
      fs.push(func);
  }

  get autoAlignCardOnInteractionEnabled() {
    return true;
  }

  get tableSide() {
    return this.side;
  }

  set tableSide(s) {
    if (s != this.side) {
      this.side = s;
      this.triggerCallbacks("table_side_changed", s);
    }
  }

  get hasPrivateArea() {
    return this.privateAreaId !== null;
  }

  get privateArea() {
    return this.privateAreaId;
  }

  set privateArea(obj) {
    const newId = obj === null ? null : obj.id;
    const prevId = this.privateAreaId;
    if (prevId !== newId) {
      this.privateAreaId = newId;
      this.triggerCallbacks('private_area_exited', prevId);
      if (newId !== null) {
        this.tableSide = obj.side;
        this.triggerCallbacks('private_area_entered', newId);
        obj.text = this.updateInputName();
        this.sendInput('change_name '+obj.id+' '+obj.text);
      } else {
        this.updateInputName();
      }
    }
  }

  triggerCallbacks(eventName, param) {
    for (let f of this.callbacks.get(eventName)) {
      f(param);
    }
  }
}
