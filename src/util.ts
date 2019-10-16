export function humanReadableSize(size: number) {
    if (size < 2 ** 10) {
        return `${size}`;
    }
    else if (size < 2 ** 20) {
        return `${size / (2 ** 10)}K`;
    }
    else if (size < 2 ** 30) {
        return `${size / (2 ** 20)}M`;
    }
    else if (size < 2 ** 40) {
        return `${size / (2 ** 30)}G`;
    }
    else if (size < 2 ** 50) {
        return `${size / (2 ** 40)}T`;
    }
    return `${size / (2 ** 50)}P`;
}

export function normalizeStoragePath(path?: string | String): string {
    if (path instanceof String) {
        path = path.valueOf();
    }

    // ensure string
    if (typeof path !== 'string') {
        path = (path as any).toString();
    }

    if (path) {

        // convert backslash to forward slash
        path = path.replace('\\', '/');

        // ensure no leading slash
        while (path.length > 0 && path[0] === '/') {
            path = path.slice(1);
        }

        // ensure no trailing slash
        while (path.length > 0 && path[path.length - 1] === '/') {
            path = path.slice(0, path.length - 1);
        }

        // collapse any repeated slashes
        let previous_char = null;
        let collapsed = '';
        for (const char of (path as string)) {
            if (char === '/' && previous_char === '/') {
                // Skip
            } else {
                collapsed += char;
                previous_char = char;
                path = collapsed;
            }
        }

        // don't allow path segments with just '.' or '..'
        const segments = path.split('/');

        for (const s of segments) {
            if (s === "." || s === "..") {
                throw Error("path containing '.' or '..' segment not allowed")
            }
        }
    }
    else {
        path = ''
    }
    return path as string;
}