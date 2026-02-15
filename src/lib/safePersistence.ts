export function safeGetItem(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        console.warn(`localStorage.getItem("${key}") failed`);
        return null;
    }
}

export function safeSetItem(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        console.warn(`localStorage.setItem("${key}") failed`);
        return false;
    }
}

export function safeRemoveItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch {
        console.warn(`localStorage.removeItem("${key}") failed`);
    }
}
