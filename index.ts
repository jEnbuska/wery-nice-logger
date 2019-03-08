export type NiceloggerLogLevel = 'log' | 'warn' | 'error'
export type NiceLoggerConsole = Pick<typeof console, NiceloggerLogLevel>;
export type NiceLoggerFilter = ({stackInfo, args, func}: {stackInfo: NiceStack, args: any[], func: NiceloggerLogLevel}) => boolean;
export type NiceLoggerFormatter = ({stackInfo, args, func}: {stackInfo: NiceStack, args: any[], func: NiceloggerLogLevel}) => any;
export type NiceStack = ({file: string, func: string, char: string, line: string})[]

const filePath = require.main!.filename.split('/')
filePath.pop();
const mainDirectory = filePath.join('/');

export function createStackInfo(): NiceStack {
    const ctx: {stack?: string} = {}
    Error.captureStackTrace(ctx);
    const rows = ctx.stack!.split('\n').splice(3).map(row => row.trim())
    const out = [];
    for(const row of rows) {
        const [_, func, ...rest] = row.split(' ');
        const position = rest.join();
        const [char, line, ...filePath] = position.substring(0, position.length-1).split(':').reverse();
        const file = filePath.reverse().join(':').replace(mainDirectory, '.').substring(1);
        if(file.startsWith('internal/modules/')) break;
        out.push({file, func: func.startsWith('Object.') ? func.replace('Object.', '') : func, char, line});
    }
    return out;    
}


const defaultFormat: NiceLoggerFormatter = ({args, stackInfo}) => {
    const [{line = '<?>', func = '<?>', file = '<?>'} = {}] = stackInfo;
    const filePlusLine = `${file}:${line}`
    return ["\x1b[0m", args.join(' '), '    ',"\x1b[34m", `${filePlusLine}`,"\x1b[0m", ,"\x1b[2m", '\t\t', `ƒ:${func}`, "\x1b[0m"].join('')
}

export function createLogger({console: c = console, filter = () => true, format = defaultFormat, silent = false}: {console?: NiceLoggerConsole, filter?: NiceLoggerFilter, format?: NiceLoggerFormatter, silent?: boolean} = {}){
    const ctx = {filter, format, silent, console: c};
    return Object.defineProperties({}, {
        log: {
            writable: false,
            value(...args: any[]) {
                if(ctx.silent) return;
                const stackInfo = createStackInfo();
                if(ctx.filter({args, stackInfo, func: 'log'})) {
                    ctx.console.log(ctx.format({stackInfo, args, func: 'log'}))
                }
            },
        },
        warn: {
            writable: false,
            value(...args: any[]) {
                if(ctx.silent) return;
                const stackInfo = createStackInfo();
                if(ctx.filter({args, stackInfo, func: 'warn'})) {
                    ctx.console.warn(ctx.format({stackInfo, args, func: 'warn'}))
                }
            }
        },
        error: {
            writable: false,
            value(...args: any[]) {
                if(ctx.silent) return;
                const stackInfo = createStackInfo();
                if(ctx.filter({args, stackInfo, func: 'error'})) {
                    ctx.console.error(ctx.format({stackInfo, args, func: 'error'}))
                }
            }
        },
        console: {
            set(value: NiceLoggerConsole) {
                ctx.console = value;
            },
        },
        filter: {
            set(value: NiceLoggerFilter){
                ctx.filter = value;
            }
        },
        format: {
            set(value: NiceLoggerFormatter) {
                ctx.format = value;
            },
        },
        silent: {
            set(value: boolean) {
                ctx.silent = value;
            }
        }
    })
}
