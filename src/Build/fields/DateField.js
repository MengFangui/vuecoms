import Field from './Field'
import {isDate} from '@/utils/utils.js'

export default class DateField extends Field {
  constructor (options) {
    super(options)
    this.component = 'DatePicker'
    this.defaultOptions = {transfer: true}
    this.events = ['input']
  }

  convert_value (x) {
    if (x instanceof Date){
      let mon = x.getMonth() + 1 < 10 ? `0${x.getMonth()+1}` : `${x.getMonth()+1}`
      return `${x.getFullYear()}/${mon}/${x.getDate()}`
    }
    if (isDate(x)) {
      return x
    }
    return ''
  }
}
