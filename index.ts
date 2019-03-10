export type NiceloggerLogLevel = 'log' | 'warn' | 'error' | 'catch'
export type NiceLoggerConsole = Pick<typeof console, 'log' | 'warn' | 'error'>;
export type NiceFormattable = {traceInfo: NiceTrace, args: any[], level: NiceloggerLogLevel}
export type NiceLoggerFormatter = ({traceInfo, args, level}: NiceFormattable) => any | any[];
export type NiceTrace = ({file: string, func: string, char: string, line: string})[]

const defaultFormat: NiceLoggerFormatter = ({args, traceInfo, level}) => {
    const [{line = '<?>', file = '<?>'} = {}] = traceInfo;
    const filePlusLine = `${file}:${line}`    
    const func = traceInfo.map(({func}) => func).join(' <| ');
    if(level === 'catch') {
        const [err, ...rest] = args;
        args = [err, '\n', ...rest];
    }
    return ["\x1b[0m", ...args, '\n',"\x1b[4m", `${filePlusLine}`,"\x1b[0m", "\x1b[2m", '  \t', `ƒ ${func}`, "\x1b[0m"]
}

type NiceLogger = NiceLoggerConsole & {
    catch: (err: Error, ...params: any[]) => void;
    console: NiceLoggerConsole;
    format: NiceLoggerFormatter;
    silent: boolean;
    pathPrefix: string;
    filterArgs: RegExp;
    filterFunc: RegExp;
    filterFile: RegExp;
    filterLevels: NiceloggerLogLevel[];
}

const regExpAll = /.*/;
const allLogLevels: NiceloggerLogLevel [] = ['log', 'error', 'warn', 'catch'];
export function createLogger(constructorObj: Partial<NiceLogger> = {}): NiceLogger {
    const {
        console: c = console, 
        filterArgs = regExpAll, 
        filterFunc = regExpAll,
        filterFile = regExpAll,
        filterLevels = allLogLevels,
        format = defaultFormat, 
        pathPrefix = '.', 
        silent = false, 
    } = constructorObj;
    let symbolTextWarned = false;
    const ctx = {console: c, filterArgs, filterFunc, filterFile, filterLevels, format, pathPrefix, silent};
    
    function createTraceInfo(stack: string, jumpBack: number): NiceTrace {
        const filePath = require.main!.filename.split('/')
        filePath.pop();
        const mainDirectory = filePath.join('/');    
        const rows = stack.split('\n').splice(jumpBack).map(row => row.trim())
        
        const out = [];
        for(const row of rows) {
            let [position, ...rest] = row.split(' ').reverse().filter(it => !/^\[|^at$|\]$/.test(it));
            position = position.substring(1, position.length-1);
            const func = rest.join(' ')
            const [char, line, ...filePath] = position.split(':').reverse();        
            const file = filePath.reverse().join(':').replace(mainDirectory, '');
            out.push({
                file: `${pathPrefix}${file}`, 
                func, 
                char, 
                line
            });
        }
        return out;
    }
    const filterSome = (args: any[], test: (arg: any) => boolean) => {        
        return args.some((arg) => {
            const t = typeof arg;
            switch(t) {
                case 'symbol': {
                    if(!symbolTextWarned) {
                        symbolTextWarned = true;
                        console.warn('wery-nice-logger does not know how to filter Symbol text')
                    }
                    return false;
                }
                case 'object': {
                    if(arg instanceof Error) {
                        break;
                    } else if(arg instanceof RegExp) {
                        break;
                    } else {
                        JSON.stringify(arg);
                    }
                }
            }
            return test(arg);
        })
    }

    const doFormat = (obj: NiceFormattable) => {
        try {   
            return ctx.format(obj);
        } catch (e) {
            console.error('loggers format failed', e, 'printing raw arguments instead')
            return obj.args
        }
    } 

    const createLogger = (level: NiceloggerLogLevel) => (...args: any[]) => {
        if(ctx.silent) return;
        if(!filterSome([level], (level) => ctx.filterLevels.includes(level))) return;
        if(!filterSome(args, (arg) => ctx.filterArgs.test(arg))) return;        
        const current: {stack?: string} = {}
        Error.captureStackTrace(current);
        const traceInfo = createTraceInfo(current.stack!, 2);
        let searchTraceInfo;
        if(level === 'catch') searchTraceInfo = [...traceInfo, ...createTraceInfo(args[0].stack, 1) ];
        else searchTraceInfo = traceInfo;
        if(!filterSome(searchTraceInfo.map(it => it.func), (func) => ctx.filterFunc.test(func))) return;
        if(!filterSome(searchTraceInfo.map(it => it.file), file => ctx.filterFile.test(file))) return;
        const formatted = doFormat({traceInfo, args, level})
        ctx.console[level === 'catch' ? 'error' : level](...formatted);
    }

    
    return {
        log: createLogger('log'),
        warn: createLogger('warn'),
        error: createLogger('error'),
        catch: createLogger('catch'),
        get console(){
            return ctx.console;
        },
        set console(value: NiceLoggerConsole) {
            ctx.console = value;
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
        },
        get pathPrefix() {
            return ctx.pathPrefix;
        },
        set pathPrefix(value: string) {
            ctx.pathPrefix = value;
        },
        get filterFile(){
            return ctx.filterFile;
        },
        set filterFile(value: RegExp) {
            ctx.filterFile = value;
        },
        get filterLevels(){
            return ctx.filterLevels;
        },
        set filterLevels(value: NiceloggerLogLevel[]) {
            ctx.filterLevels = value;
        },
        get filterArgs(){
            return ctx.filterArgs;
        },
        set filterArgs(value: RegExp) {
            ctx.filterArgs = value;
        },
        set filterFunc(value: RegExp) {
            ctx.filterFunc = value;
        },
        get filterFunc() {
            return ctx.filterFunc;
        },    
    }
}
