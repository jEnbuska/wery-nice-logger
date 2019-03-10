import {createLogger} from '../../index'

export const logger = createLogger({filterFunc: /throwAnError/, filterArgs: /abc/, filterFile: /other/});