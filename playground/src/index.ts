import {logger} from './logger'
import {throwAnError} from './folder/other';

function testErrorStack(){
    setTimeout(() => {
        logger.log('abc')
        try {
            throwAnError('abc')
        } catch(e) {
            logger.catch(e, 'test');
        }
    }, 0)
}
testErrorStack() 