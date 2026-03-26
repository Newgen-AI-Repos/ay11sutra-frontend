/**
 * apiFetch.ts
 * A wrapper around native fetch that handles automatic token refresh.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ay11sutra-backend-production.up.railway.app";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiFetch(url: string | URL, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.toString().startsWith("http") ? url.toString() : `${API_BASE}${url}`;
  
  // 1. Attach current token
  const token = typeof window !== 'undefined' ? localStorage.getItem("ay11sutra_token") : null;
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const fetchOptions = { ...options, headers };

  // 2. Perform original request
  let response = await fetch(fullUrl, fetchOptions);

  // 3. Handle 401 Unauthorized
  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      
      try {
        // Attempt to refresh the token
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Include credentials to send the HttpOnly refresh_token cookie
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const newToken = data.access_token;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem("ay11sutra_token", newToken);
          }
          
          isRefreshing = false;
          onTokenRefreshed(newToken);
        } else {
          // Refresh failed - clean up and redirect
          isRefreshing = false;
          if (typeof window !== 'undefined') {
            localStorage.removeItem("ay11sutra_token");
            localStorage.removeItem("ay11sutra_auth");
            // Clear any queued requests by notifying them with null (or rejected)
            onTokenRefreshed(""); 
            window.location.href = "/login?expired=true";
          }
          return response;
        }
      } catch (err) {
        isRefreshing = false;
        onTokenRefreshed(""); 
        console.error("Token refresh error:", err);
        return response;
      }
    }

    // 4. Queue requests while refreshing
    return new Promise((resolve) => {
      subscribeTokenRefresh((newToken) => {
        if (!newToken) {
          // If refresh failed, just resolve with the original 401
          resolve(response);
          return;
        }
        headers.set("Authorization", `Bearer ${newToken}`);
        resolve(fetch(fullUrl, { ...options, headers }));
      });
    });
  }

  return response;
}
