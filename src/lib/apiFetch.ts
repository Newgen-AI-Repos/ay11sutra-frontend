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

  try {
    // 2. Perform original request
    let response = await fetch(fullUrl, fetchOptions);

    // 3. Handle 401 Unauthorized (only if it's not the refresh or login endpoint to avoid loops)
    const isAuthEndpoint = fullUrl.includes("/auth/refresh") || fullUrl.includes("/auth/login");
    
    if (response.status === 401 && !isAuthEndpoint) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
            resolve(response);
            return;
          }
          headers.set("Authorization", `Bearer ${newToken}`);
          resolve(fetch(fullUrl, { ...options, headers }));
        });
      });
    }

    return response;
  } catch (err: any) {
    console.error("API Fetch Error:", err);
    
    // Specifically catch network errors (TypeErrors from fetch)
    if (err.name === 'TypeError' || err.message.includes('fetch')) {
      // Create a fake response to indicate network error without crashing
      return new Response(JSON.stringify({
        error: "Network error: Connection refused or server unreachable.",
        code: "NETWORK_ERROR",
        status: "error"
      }), {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" }
      });
    }
    
    throw err;
  }
}
