import {logger} from '../logger'


export function throwAnError(msg: string){
    logger.log('abc')
    throw Error(msg);
}



