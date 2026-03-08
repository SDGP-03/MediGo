/**
 * apiClient — Centralized HTTP client for the NestJS backend.
 *
 * - Attaches Firebase ID token as Authorization: Bearer <token>
 * - Points to http://localhost:3001/api
 * - Provides helpers for SSE (EventSource) connections
 */

import { auth } from '../firebase';

const API_BASE = 'http://localhost:3001/api';

/** Get the current user's Firebase ID token */
async function getIdToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
}

/** Make an authenticated fetch request to the backend */
export async function apiFetch<T = any>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = await getIdToken();
    const url = `${API_BASE}${path}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) return undefined as T;

    return response.json();
}

/** Convenience POST */
export async function apiPost<T = any>(path: string, body: any): Promise<T> {
    return apiFetch<T>(path, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/** Convenience PUT */
export async function apiPut<T = any>(path: string, body: any): Promise<T> {
    return apiFetch<T>(path, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

/** Convenience DELETE */
export async function apiDelete<T = any>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE' });
}

/**
 * Create an authenticated SSE (Server-Sent Events) connection.
 * Returns an EventSource-like object that reconnects with fresh tokens.
 *
 * Usage:
 *   const cleanup = createSSE('/fleet/stream', (data) => setFleetData(data));
 *   return cleanup; // call in useEffect cleanup
 */
export function createSSE(
    path: string,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
): () => void {
    let eventSource: EventSource | null = null;
    let cancelled = false;

    const connect = async () => {
        if (cancelled) return;

        try {
            const token = await getIdToken();
            const url = `${API_BASE}${path}?token=${encodeURIComponent(token)}`;

            eventSource = new EventSource(url);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                } catch {
                    console.error('[SSE] Failed to parse message:', event.data);
                }
            };

            eventSource.onerror = (error) => {
                console.warn('[SSE] Connection error, reconnecting...', error);
                onError?.(error);
                eventSource?.close();
                // Reconnect after 3 seconds
                if (!cancelled) {
                    setTimeout(connect, 3000);
                }
            };
        } catch (error) {
            console.error('[SSE] Failed to connect:', error);
            if (!cancelled) {
                setTimeout(connect, 3000);
            }
        }
    };

    connect();

    return () => {
        cancelled = true;
        eventSource?.close();
    };
}
