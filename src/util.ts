export function humanReadableSize(size: number) {
    if (size < 2 ** 10) {
        return `${size}`;
    }
    else if (size < 2 ** 20) {
        return `${(size / (2 ** 10)).toFixed(1)}K`;
    }
    else if (size < 2 ** 30) {
        return `${(size / (2 ** 20)).toFixed(1)}M`;
    }
    else if (size < 2 ** 40) {
        return `${(size / (2 ** 30)).toFixed(1)}G`;
    }
    else if (size < 2 ** 50) {
        return `${(size / (2 ** 40)).toFixed(1)}T`;
    }
    return `${(size / (2 ** 50)).toFixed(1)}P`;
}

export function normalizeStoragePath(path: string | String): string {
    if (path instanceof String) {
        path = path.valueOf();
    }

    // convert backslash to forward slash
    path = path.replace(/\\/g, "/");
    // ensure no leading slash
    while (path.length > 0 && path[0] === '/') {
        path = path.slice(1);
    }

    // ensure no trailing slash
    while (path.length > 0 && path[path.length - 1] === '/') {
        path = path.slice(0, path.length - 1);
    }


    // collapse any repeated slashes
    path = path.replace(/\/\/+/g, "/")

    // don't allow path segments with just '.' or '..'
    const segments = path.split('/');

    for (const s of segments) {
        if (s === "." || s === "..") {
            throw Error("path containing '.' or '..' segment not allowed")
        }
    }
    return path as string;
}