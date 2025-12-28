export default class WebWorker {
    postMessage(msg: any) { }
    onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
    addEventListener() { }
    removeEventListener() { }
    terminate() { }
}
