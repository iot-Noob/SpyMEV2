export class SignalingSocket {
    /**
     * @param {string} userId
     * @param {Object} handlers - { onOpen, onMessage, onClose, onError }
     * @param {"master"|"slave"} role
     */
    constructor(userId, handlers = {}, role = "slave") {
        if (!userId) throw new Error("userId is required for signaling socket");

        this.userId = userId;
        this.role = role;
        this.handlers = handlers;

        this.socket = null;
        this.sendQueue = [];
        this.isReconnecting = false;
        this.retryCount = 0;
        this.maxRetries = 5;

        this.connect();
    }

    /** 🧠 Create and connect WebSocket */
    connect(WS_URL) {
        const url = `${WS_URL}?id=${encodeURIComponent(this.userId)}&role=${this.role}`;
        this.socket = new WebSocket(url);
        this.socket.onopen = this._handleOpen.bind(this);
        this.socket.onmessage = this._handleMessage.bind(this);
        this.socket.onerror = this._handleError.bind(this);
        this.socket.onclose = this._handleClose.bind(this);
    }

    /** 🔄 Internal event handlers */
    _handleOpen() {
        console.log(`[WS:${this.userId}] Connected`);
        this.retryCount = 0;
        this.isReconnecting = false;
        this._flushQueue();
        this.handlers.onOpen?.(this.socket);
    }
    
    _handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.handlers.onMessage?.(data, this.socket);
        } catch (err) {
            console.error(`[WS:${this.userId}] Invalid JSON:`, event.data);
        }
    }

    _handleError(error) {
        console.error(`[WS:${this.userId}] Error:`, error);
        this.handlers.onError?.(error, this.socket);
    }

    _handleClose(event) {
        console.warn(`[WS:${this.userId}] Closed: code=${event.code}, reason=${event.reason}`);
        this.handlers.onClose?.(event, this.socket);

        if (!this.isReconnecting && this.retryCount < this.maxRetries) {
            this.reconnect();
        }
    }

    /** 📨 Send data or queue if socket isn’t ready */
    send(action, payload = {}) {
        if (!action) {
            console.warn("[WS] Missing action");
            return;
        }

        const msg = JSON.stringify({ action, payload });

        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(msg);
        } else {
            console.log(`[WS:${this.userId}] Queued message (socket not open yet)`);
            this.sendQueue.push(msg);
        }
    }

    /** 🚀 Flush queued messages */
    _flushQueue() {
        while (this.sendQueue.length > 0) {
            const msg = this.sendQueue.shift();
            this.socket.send(msg);
        }
    }

    /** ♻️ Attempt reconnection with exponential backoff */
    reconnect() {
        this.isReconnecting = true;
        const delay = Math.min(1000 * 2 ** this.retryCount, 10000);
        console.log(`[WS:${this.userId}] Reconnecting in ${delay / 1000}s...`);
        setTimeout(() => {
            this.retryCount++;
            this.connect();
        }, delay);
    }
    /**
     * 
     * @returns {WebSocket.readyState}
     */
    getStatus() {
        if (!this.socket) return "closed";

        switch (this.socket.readyState) {
            case WebSocket.CONNECTING:
                return "connecting";
            case WebSocket.OPEN:
                return "open";
            case WebSocket.CLOSING:
                return "closing";
            case WebSocket.CLOSED:
                return "closed";
            default:
                return "unknown";
        }
    }

    /** 🧹 Gracefully close the socket */
    close(code = 1000, reason = "manual close") {
        console.log(`[WS:${this.userId}] Closing socket...`);
        this.socket?.close(code, reason);
        this.isReconnecting = false;
    }
}
