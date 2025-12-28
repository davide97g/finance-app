export default class WebWorker {
    postMessage(_msg: any) { }
    onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
    addEventListener() { }
    removeEventListener() { }
    terminate() { }
}
