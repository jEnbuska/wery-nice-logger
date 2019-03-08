/// <reference types="node" />
export declare type NiceloggerLogLevel = 'log' | 'warn' | 'error';
export declare type NiceLoggerConsole = Pick<typeof console, NiceloggerLogLevel>;
export declare type NiceLoggerFilter = ({ stackInfo, args, func }: {
    stackInfo: NiceStack;
    args: any[];
    func: NiceloggerLogLevel;
}) => boolean;
export declare type NiceLoggerFormatter = ({ stackInfo, args, func }: {
    stackInfo: NiceStack;
    args: any[];
    func: NiceloggerLogLevel;
}) => any;
export declare type NiceStack = ({
    file: string;
    func: string;
    char: string;
    line: string;
})[];
export declare function createStackInfo(): NiceStack;
export declare function createLogger({ console: c, filter, format, silent }?: {
    console?: NiceLoggerConsole;
    filter?: NiceLoggerFilter;
    format?: NiceLoggerFormatter;
    silent?: boolean;
}): any;
