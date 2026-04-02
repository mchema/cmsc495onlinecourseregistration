export function authHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function request(baseUrl, path, options = {}) {
    const { headers = {}, ...rest } = options;

    const finalHeaders = {
        ...headers,
    };

    if (rest.body !== undefined) {
        finalHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseUrl}${path}`, {
        ...rest,
        headers: finalHeaders,
    });

    let body = null;

    try {
        body = await res.json();
    } catch {
        body = null;
    }

    return {
        status: res.status,
        ok: res.ok,
        body,
    };
}
