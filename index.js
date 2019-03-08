"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filePath = require.main.filename.split('/');
filePath.pop();
const mainDirectory = filePath.join('/');
function createStackInfo() {
    const ctx = {};
    Error.captureStackTrace(ctx);
    const rows = ctx.stack.split('\n').splice(3).map(row => row.trim());
    const out = [];
    for (const row of rows) {
        const [_, func, ...rest] = row.split(' ');
        const position = rest.join();
        const [char, line, ...filePath] = position.substring(0, position.length - 1).split(':').reverse();
        const file = filePath.reverse().join(':').replace(mainDirectory, '.').substring(1);
        if (file.startsWith('internal/modules/'))
            break;
        out.push({ file, func: func.startsWith('Object.') ? func.replace('Object.', '') : func, char, line });
    }
    return out;
}
exports.createStackInfo = createStackInfo;
const defaultFormat = ({ args, stackInfo }) => {
    const [{ line = '<?>', func = '<?>', file = '<?>' } = {}] = stackInfo;
    const filePlusLine = `${file}:${line}`;
    return ["\x1b[0m", args.join(' '), '    ', "\x1b[34m", `${filePlusLine}`, "\x1b[0m", , "\x1b[2m", '\t\t', `ƒ:${func}`, "\x1b[0m"].join('');
};
function createLogger({ console: c = console, filter = () => true, format = defaultFormat, silent = false } = {}) {
    const ctx = { filter, format, silent, console: c };
    return Object.defineProperties({}, {
        log: {
            writable: false,
            value(...args) {
                if (ctx.silent)
                    return;
                const stackInfo = createStackInfo();
                if (ctx.filter({ args, stackInfo, func: 'log' })) {
                    ctx.console.log(ctx.format({ stackInfo, args, func: 'log' }));
                }
            },
        },
        warn: {
            writable: false,
            value(...args) {
                if (ctx.silent)
                    return;
                const stackInfo = createStackInfo();
                if (ctx.filter({ args, stackInfo, func: 'warn' })) {
                    ctx.console.warn(ctx.format({ stackInfo, args, func: 'warn' }));
                }
            }
        },
        error: {
            writable: false,
            value(...args) {
                if (ctx.silent)
                    return;
                const stackInfo = createStackInfo();
                if (ctx.filter({ args, stackInfo, func: 'error' })) {
                    ctx.console.error(ctx.format({ stackInfo, args, func: 'error' }));
                }
            }
        },
        console: {
            set(value) {
                ctx.console = value;
            },
        },
        filter: {
            set(value) {
                ctx.filter = value;
            }
        },
        format: {
            set(value) {
                ctx.format = value;
            },
        },
        silent: {
            set(value) {
                ctx.silent = value;
            }
        }
    });
}
exports.createLogger = createLogger;
