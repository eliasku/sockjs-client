class Event {
  type: string;
  bubbles: boolean = false;
  cancelable: boolean = false;
  timeStamp: number = 0;

  constructor(eventType: string) {
    this.type = eventType;
  }

  initEvent(eventType: string, canBubble: boolean, cancelable: boolean): Event {
    this.type = eventType;
    this.bubbles = canBubble;
    this.cancelable = cancelable;
    this.timeStamp = +new Date();
    return this;
  }

  stopPropagation(): void {}
  preventDefault(): void {}

  static CAPTURING_PHASE = 1;
  static AT_TARGET = 2;
  static BUBBLING_PHASE = 3;
}

export { Event };
