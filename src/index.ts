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
    return ["\x1b[0m", args.join(' '), '    ',"\x1b[4m", `${filePlusLine}`,"\x1b[0m", ,"\x1b[2m", '\t\t', `ƒ:${func}`, "\x1b[0m"].join('')
}

type NiceLogger = NiceLoggerConsole & {
    console: NiceLoggerConsole;
    filter: NiceLoggerFilter;
    format: NiceLoggerFormatter;
    silent: boolean;
}

export function createLogger({console: c = console, filter = () => true, format = defaultFormat, silent = false}: {console?: NiceLoggerConsole, filter?: NiceLoggerFilter, format?: NiceLoggerFormatter, silent?: boolean} = {}): NiceLogger {
    const ctx = {filter, format, silent, console: c};
    const shouldWriteToConsole: NiceLoggerFilter = (obj) => {
        try {
            return ctx.filter(obj)
        } catch(e){
            console.error('loggers filter failed', e, 'filter defaulting to true')
            return true;
        }
    }

    const formatConsoleData: NiceLoggerFormatter = (obj) => {
        try {   
            return ctx.format(obj);
        } catch (e) {
            console.error('loggers format failed', e, 'printing raw arguments instead')
            return obj.args
        }
    } 

    return {
        log(...args: any[]) {
            if(ctx.silent) return;
            const stackInfo = createStackInfo();
            if(shouldWriteToConsole({args, stackInfo, func: 'log'})) {
                ctx.console.log(formatConsoleData({stackInfo, args, func: 'log'}))
            }
        },
        warn(...args: any[]) {
            if(ctx.silent) return;
            const stackInfo = createStackInfo();
            if(shouldWriteToConsole({args, stackInfo, func: 'warn'})) {
                ctx.console.warn(formatConsoleData({stackInfo, args, func: 'warn'}))
            }
        },
        error(...args: any[]) {
            if(ctx.silent) return;
            const stackInfo = createStackInfo();
            if(shouldWriteToConsole({args, stackInfo, func: 'error'})) {
                ctx.console.error(formatConsoleData({stackInfo, args, func: 'error'}))
            }
        },
        get console(){
            return ctx.console;
        },
        set console(value: NiceLoggerConsole) {
            ctx.console = value;
        },
        get filter(){
            return ctx.filter;
        },
        set filter(value: NiceLoggerFilter){
            ctx.filter = value;
        },
        get format() {
            return ctx.format
        },
        set format(value: NiceLoggerFormatter) {
            ctx.format = value;
        },
        get silent(){
            return ctx.silent;
        },
        set silent(value: boolean) {
            ctx.silent = value;
        }
    }
}
