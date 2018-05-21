import List from '@/utils/list.js'
import {uuid} from '@/utils/utils.js'

class Store {
  constructor (grid, options, value) {
    this.grid = grid
    this.states = {
      columns: [],
      rowHeight: 34,
      minColWidth: 5,
      defaultColWidth: 100,
      nowrap: false,
      width: 'auto',
      height: 'auto',
      gridWidth: 0,
      checkCol: false,
      checkColWidth: 30,
      checkColTitle: '',
      idField: 'id',
      data: [],
      multiSelect: false,
      clickSelect: false,  // 点击选中
      resizable: true, // 是否表头列可以调整大小
      draggable: false,
      indexCol: false, // 是否显示序号列
      indexColTitle: '#',
      indexColWidth: 40,
      loadingText: '<i class="icon-loading ivu-icon ivu-icon-load-c"></i> Loading...', // 正在装入时显示的文本
      autoLoad: true, // 是否自动装入数据
      parseUrl: true, // 是否从URL解析查询参数
      url: '', // 访问后台的URL
      param: {
      }, // 访问后台的URL所带参数
      buttons: [],
      rightButtons: [],
      bottomButtons: [],
      comments: {}, // 记录单元格的注释，形式为 {row_id: {col_name:comment}}
      classes: {}, // 记录单元格的class
      combineCols: [], // 单元格合并列名
      editMode: '', // 编辑模式 'full' 全屏模式 'row' 行模式
      actionColumn: '', // 行编辑时，显示编辑按钮的列名,将缺省显示['编辑', '删除']
      deleteRowConfirm: true, // 删除前是否先确认
      query: null, // 查询条件对象

      // 回调
      onLoadData: null, // 装入数据回调函数，将传入 function (url, param, callback)
      onSelect: null, // 在选择行前执行，返回为True，则允许选中
      onDeselect: null, // 在取消选择行前执行，返回为True，则允许取消选中
      onCheckable: null, // 是否显示checkbox
      onSaveRow: null, // 保存行时调用 function (row, callback), callback(flag, data)
                       // flag 为 'ok'表示成功，data 为最后的数据 'error'表示有错误, data为出错信息
      onSaveCol: null,  // 保存单元格时调用 function (value, callback), callback(flag, data)
                        // flag 为 'ok'表示成功，data 为最后的数据 'error'表示有错误, data为出错信息
      onDeleteRow: null,// 删除行的确认 function (row, callback), callback(flag, data)

      // 内部变量
      drawColumns: [], // 用于绘制的表头
      columnResizing: false,
      columnPosition: 0,
      checkAll: false,
      fixedColumns: [],
      leftWidth: 0, // 左则固定列宽度
      hscroll: false,
      xscroll: false,
      scrollLeft: 0, // 记录横向滚动条偏移量，用于显示左侧固定列的特殊样式
      guiderHeight: 0, // 拖动指示器的高度
      loading: false, // 是否显示loading信息
      loadingLeft: 0,
      loadingTop: 0,
      selected: {}, // 记录选中结果，可以跨页保存
      selectedRows: {},

      // 分页相关参数
      prev: '上一页',
      next: '下一页',
      first: '',
      last: '',
      start: 1,
      total: 0,       // 总条数
      pageSizeOpts: [10, 20, 30, 40, 50], // 每页条数选项
      pagination: false, // 是否显示分页信息，缺省为 false
      page: 1,
      pageSize: 10
    }

    for (let name in options) {
      if (options.hasOwnProperty(name) && this.states.hasOwnProperty(name)) {
        this.states[name] = options[name]
      }
    }

    if (value && value.length > 0) {
      this.states['data'] = value
    }

    this.setParam(options.param)

    // 初始化states.param
    this.states.param.page = this.states.page
    this.states.param.pageSize = this.states.pageSize

    if (!grid) {
      throw new Error('Grid object is Required.')
    }
  }

  selected (row) {
    return row._selected
  }

  toggle (row) {
    if (row._selected) this.deselect(row)
    else this.select(row)
  }

  _select (row) {
    let selectable = true
    if (this.states.onSelect) {
      selectable = this.states.onSelect(row)
    }
    this.grid.$set(row, '_selected', selectable)
    if (selectable) {
      this.grid.$set(row, '_selected', true)
      let id = row[this.states.idField]
      this.grid.$set(this.states.selected, id, id)
      this.grid.$set(this.states.selectedRows, id, row)
    }
  }

  select (row) {
    if (!this.states.multiSelect) this.deselectAll()
    this._select(row)
    this.grid.$emit('on-selected', row)
  }

  selectAll () {
    this.states.data.forEach(row => {
      this._select(row)
    })
    this.grid.$emit('on-selected-all')
  }

  _deselect (row) {
    let deselectable = true
    if (this.states.onDeselect) {
      deselectable = this.states.onDeselect(row)
    }
    this.grid.$set(row, '_deselected', deselectable)
    if (deselectable) {
      this.grid.$set(row, '_selected', false)
      this.grid.$delete(this.states.selected, row[this.states.idField])
      this.grid.$delete(this.states.selectedRows, row[this.states.idField])
    }
  }

  deselect (row) {
    this._deselect(row)
    this.grid.$emit('on-deselected', row)
  }

  deselectAll () {
    this.states.data.forEach(row => {
      this._deselect(row)
    })
    this.grid.$emit('on-deselected-all')
  }

  getSelection () {
    return Object.values(this.states.selected)
  }

  getSelectedRows () {
    return Object.values(this.states.selectedRows)
  }

  setSelection (selection) {
    for(let row of this.states.data) {
      let id = row[this.states.idField]
      if (this.states.selected.hasOwnProperty(id)) {
        this.grid.$set(row, '_selected', true)
      }
    }
  }

  showLoading (loading=true, text='') {
    this.states.loading = loading
    if (text) {
      this.states.loadingText = text
    }
    if (loading) {
      this.states.loadingTop = this.grid.$refs.table.$el.clientHeight/2-this.states.rowHeight/2
      this.states.loadingLeft = this.grid.$refs.table.$el.clientWidth/2-100/2
    }
  }

  removeRow (row) {
    let removed = List.remove(this.states.data, row, this.states.idField)
    for(let i of removed) {
      this.deselect(i)
    }
  }

  getKey (row, column) {
    let key, col
    if (typeof row === 'object') {
      key = row[this.states.idField]
    } else {
      key = row
    }
    if (typeof column === 'object') {
      col = column.name
    } else {
      col = column
    }
    return {key, col}
  }


  getComment (row, column) {
    let {key, col} = this.getKey(row, column)
    let r = this.states.comments[key]
    if (!r) return ''
    return r[col]
  }

  setComment (row, column, content, type='info') {
    let {key, col} = this.getKey(row, column)
    let r = this.states.comments[key]
    if (!r) {
      r = this.grid.$set(this.states.comments, key, {})
    }
    this.grid.$set(r, col, {content:content, type:type})
  }

  removeComment (row, column) {
    let {key, col} = this.getKey(row, column)
    let r = this.states.comments[key]
    if (r) {
      if (!col) {
        this.grid.$delete(this.states.comments, key)
      } else {
        this.grid.$delete(r, col)
      }
    }
  }

  getClass (row, column) {
    let {key, col} = this.getKey(row, column)
    let r = this.states.classes[key]
    if (!r) return ''
    return r[col]
  }

  setClass (row, column, name) {
    let {key, col} = this.getKey(row, column)
    let r = this.states.classes[key]
    if (!r) {
      r = this.grid.$set(this.states.classes, key, {})
    }
    this.grid.$set(r, col, name)
  }

  removeClass (row, column) {
    let {key, col} = this.getKey(row, column)
    let r = this.states.classes[key]
    if (r) {
      if (!col) {
        this.grid.$delete(this.states.classes, key)
      } else {
        this.grid.$delete(r, col)
      }
    }
  }

  addRow (row, position) {
    if (!row) {
      row = {_new: true}
      for(let c of this.states.columns) {
        let v = ''
        if (c.type === 'column') {
          row[c.name] = ''
        }
      }
    }
    if (!row[this.states.idField]) {
      row[this.states.idField] = uuid()
    }
    List.add(this.states.data, row, position)
    return row
  }

  /* 生成新的可编辑行 */
  addEditRow (row) {
    let n_row = this.addRow(row)
    this.grid.$set(n_row, '_editRow', Object.assign({}, n_row))
    this.grid.$set(n_row, '_editting', true)
    return n_row
  }

  mergeStates (o) {
    for (let name in o) {
      if (this.states.hasOwnProperty(name)) {
        this.grid.$set(this.states, name, o[name])
      }
    }
  }

  /* 设置查询相关的参数，分别回填到对应的 page, pageSize, query 中作为初始值 */
  setParam (p) {
    if (!p) return
    if (p.hasOwnProperty('page')) {
      this.states.page = p.page
      delete p.page
    }
    if (p.hasOwnProperty('pageSize')) {
      this.states.pageSize = p.pageSize
      delete p.pageSize
    }

    if (this.states.query)
      this.states.query.value = Object.assign({}, p)
  }

}


export default Store
