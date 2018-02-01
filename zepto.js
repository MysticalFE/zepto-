/* Zepto v1.2.0 - zepto event ajax form ie - zeptojs.com/license */
(function(global, factory) {
  if (typeof define === 'function' && define.amd)
    define(function() {
      return factory(global)
    })
  else
    factory(global)
}(this, function(window) {
  var Zepto = (function() {
    var undefined, key, $, classList, emptyArray = [],
      concat = emptyArray.concat,
      filter = emptyArray.filter,
      slice = emptyArray.slice,
      document = window.document,
      elementDisplay = {},
      classCache = {},
      cssNumber = {
        'column-count': 1,
        'columns': 1,
        'font-weight': 1,
        'line-height': 1,
        'opacity': 1,
        'z-index': 1,
        'zoom': 1
      },
      fragmentRE = /^\s*<(\w+|!)[^>]*>/,
      singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
      tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
      rootNodeRE = /^(?:body|html)$/i,
      capitalRE = /([A-Z])/g,

      // special attributes that should be get/set via method calls
      methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

      adjacencyOperators = ['after', 'prepend', 'before', 'append'],
      table = document.createElement('table'),
      tableRow = document.createElement('tr'),
      containers = {
        'tr': document.createElement('tbody'),
        'tbody': table,
        'thead': table,
        'tfoot': table,
        'td': tableRow,
        'th': tableRow,
        '*': document.createElement('div')
      },
      readyRE = /complete|loaded|interactive/,
      simpleSelectorRE = /^[\w-]*$/,
      class2type = {},
      toString = class2type.toString, //注意这里的toString,指的是Object.prototype.toString.call()用来精确判断数据类型,并不是String.prototype.toString()，
      zepto = {},
      camelize, uniq,
      tempParent = document.createElement('div'),
      propMap = {
        'tabindex': 'tabIndex',
        'readonly': 'readOnly',
        'for': 'htmlFor',
        'class': 'className',
        'maxlength': 'maxLength',
        'cellspacing': 'cellSpacing',
        'cellpadding': 'cellPadding',
        'rowspan': 'rowSpan',
        'colspan': 'colSpan',
        'usemap': 'useMap',
        'frameborder': 'frameBorder',
        'contenteditable': 'contentEditable'
      },
      //判断是否为数组类型
      //为什么zepto不使用这种方式呢
      //isArray = Array.isArray || type(object) == '[object Array]'
      isArray = Array.isArray ||
      function(object) {
        return object instanceof Array
      }
    //判断一个元素是否匹配给定的选择器
    zepto.matches = function(element, selector) {
      if (!selector || !element || element.nodeType !== 1) return false
      //判断各个浏览器的matchesSelector方法
      var matchesSelector = element.matches || element.webkitMatchesSelector ||
        element.mozMatchesSelector || element.oMatchesSelector ||
        element.matchesSelector
      if (matchesSelector) return matchesSelector.call(element, selector)
      //如果浏览器不支持MatchesSelector方法，则将节点放入一个临时div节点，
      //再通过selector来查找这个div下的节点集，再判断给定的element是否在节点集中，如果在，则返回一个非零(即非false)
      var match, parent = element.parentNode, temp = parent
      if (!temp) {
        //全局变量  tempParent = document.createElement('div'),
        ////当element没有父节点，将其插入到一个临时的div里面
        (parent = tempParent).appendChild(element)
      }
      //匹配元素选择器，match获取element在其节点集的索引值，不存在索引为-1,再按二进位取反~-1=0
      //怎么不通过判断zepto.qsa(parent, selector).indexOf(element) > -1 返回Boolean
      match = ~zepto.qsa(parent, selector).indexOf(element)
      //将临时创建的父级节点移除掉
      temp && tempParent.removeChild(element)
      return match
    }

    //判断并返回数据类型
    function type(obj) {
      return obj == null ? String(obj) :
        class2type[toString.call(obj)] || "object"
    }

    //判断是否为函数
    function isFunction(value) {
      return type(value) == "function"
    }

    //?模糊点? 判断是否window对象
    function isWindow(obj) {
      return obj != null && obj == obj.window
    }

    //判断是否为 document 对象,详见nodeType属性
    function isDocument(obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }
    //判断是否为object类型
    function isObject(obj) {
      return type(obj) == "object"
    }

    //判断是否为真正的对象,使用 Object.getPrototypeOf 函数来验证数据类型
    //Object.getPrototypeOf(obj) => 返回obj参数对象的原型
    //for example: const reg = /a/; const result = (Object.getPrototypeOf(reg) === RegExp.prototype) true;
    function isPlainObject(obj) {
      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }

    //判断是否为类数组，
    function likeArray(obj) {
      var length = !!obj && 'length' in obj && obj.length,
        type = $.type(obj)//我认为这里不直接 type(obj)的原因是在下面return时还会用到type返回值,用变量将type(obj)值保存起来
        /**
         * 3个条件：1. 'function' != type
         * 2. !isWindow(obj)
         * 3. ('array' == type || length === 0 || (typeof length == 'number' && length > 0 && (length - 1) in obj)
         */
      return 'function' != type && !isWindow(obj) && (
        'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
      )
    }

    // != 的缘故,null和undefinded会隐式转换为flase,可以同时删除数组中的 null 和 undefined
    function compact(array) {
      return filter.call(array, function(item) {
        return item != null
      })
    }

    //匹配-,可以是一个或多个,然后将匹配到的分组第一个字母变为大写 a-b-c => aBC
    //replace => 第二个参数可以为回调函数，该函数的第一个参数为匹配到的字符串，如果匹配到多个组，第二个参数为匹配到的分组字符串
    camelize = function(str) {
      return str.replace(/-+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : ''
      })
    }

    //将驼峰式写法转换为连字符'-'的写法
    function dasherize(str) { //str => Action6DExample::after
      return str.replace(/::/g, '/')  // => Action6DExample/after
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // => Action6D_Example/after
        .replace(/([a-z\d])([A-Z])/g, '$1_$2') // => Action6_D_Example/after
        .replace(/_/g, '-') // => Action6-D-Example/after
        .toLowerCase() // => action6-d-example/after
    }
    //数组去重
    uniq = function(array) {
      return filter.call(array, function(item, idx) {
        return array.indexOf(item) == idx
      })
    }
    function classRE(name) {
      return name in classCache ?
        classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    function maybeAddPx(name, value) {
      return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    function defaultDisplay(nodeName) {
      var element, display
      if (!elementDisplay[nodeName]) {
        element = document.createElement(nodeName)
        document.body.appendChild(element)
        display = getComputedStyle(element, '').getPropertyValue("display")
        element.parentNode.removeChild(element)
        display == "none" && (display = "block")
        elementDisplay[nodeName] = display
      }
      return elementDisplay[nodeName]
    }
    //返回匹配元素集合的直接子元素 $(parentLele).children([selector])
    function children(element) {
      //判断浏览器中匹配元素element中是否有children属性
      //如果有直接用children属性，没有的话，用原生childNodes
      return 'children' in element ?
        //children 返回的节点类型是元素节点
        slice.call(element.children) :
        $.map(element.childNodes, function(node) {
          //childNodes 返回的节点类型可以是元素类型，文本类型，注释类型
          //所以这里需要判断下节点类型（以保证和children返回类型一致）
          if (node.nodeType == 1) return node
        })
    }

    //{[dom]...,length:length, selector: ".test"}
    function Z(dom, selector) {
      var i, len = dom ? dom.length : 0
      for (i = 0; i < len; i++) {
        this[i] = dom[i] //this指向Zepto
      }
      this.length = len
      this.selector = selector || ''
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overridden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    zepto.fragment = function(html, name, properties) {
      var dom, nodes, container

      // A special case optimization for a single tag
      if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

      if (!dom) {
        if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
        if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
        if (!(name in containers)) name = '*'

        container = containers[name]
        container.innerHTML = '' + html
        dom = $.each(slice.call(container.childNodes), function() {
          container.removeChild(this)
        })
      }

      if (isPlainObject(properties)) {
        nodes = $(dom)
        $.each(properties, function(key, value) {
          if (methodAttributes.indexOf(key) > -1) nodes[key](value)
          else nodes.attr(key, value)
        })
      }

      return dom
    }

    //返回值为构造函数形式创建了Z对象
    zepto.Z = function(dom, selector) {
      return new Z(dom, selector)
    }

    //判断是否为Z对象
    zepto.isZ = function(object) {
      return object instanceof zepto.Z
    }

    //$函数的核心方法zepto.init
    //如果不传入context，则context默认为document
    zepto.init = function(selector, context) {
      var dom
        // If nothing given, return an empty Zepto collection
      if (!selector) return zepto.Z()  //第一个判断
        // 如果选择器为string
      else if (typeof selector == 'string') {   //第二个判断
        selector = selector.trim() //去除首尾空格
          //判断字符串是否为html标签
          //fragmentRE = /^\s*<(\w+|!)[^>]*>/ 正则判断是否为标签
        if (selector[0] == '<' && fragmentRE.test(selector))
          //fragment方法处理html字符串$('<html>')
          dom = zepto.fragment(selector, RegExp.$1, context), selector = null
          //？？？判断当前环境是否存在context上下文，不太理解这里的上下文指的是什么？
        else if (context !== undefined) return $(context).find(selector)
          // 上下文不存在的话，调用zepto.qsa()
        else dom = zepto.qsa(document, selector)
      }
      // $(function(){}) => 很常见的$自执行函数，selector为一个函数
      // 执行$(document).ready(function() {})
      else if (isFunction(selector)) return $(document).ready(selector) //第三个判断
        // 如果是Z对象，直接返回当前选择器
      else if (zepto.isZ(selector)) return selector  //第四个判断
      else {   //第五个判断
        // 如果选择器为数组的话，过滤掉null和undefined值
        if (isArray(selector)) dom = compact(selector)
          // ？？？如果选择器为对象的话，将对象变为数组形式，暂时没想到合适的例子
        else if (isObject(selector))
          dom = [selector], selector = null
          // ？？？这个判断是什么鬼，在这的作用是啥，懵逼！！！
        else if (fragmentRE.test(selector))
          dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
          //如果传入context,当前上下文$(selector, context)
        else if (context !== undefined) return $(context).find(selector)
          //如果没有传入该参数，则为undefined,默认为document
        else dom = zepto.qsa(document, selector)
      }
      // 得到dom, selector,调用函数Z
      return zepto.Z(dom, selector)
    }

    //$函数的核心zepto.init函数
    //$('element')
    $ = function(selector, context) {
      return zepto.init(selector, context)
    }

    //对象深浅拷贝，deep==true为深拷贝  deep==flase为浅拷贝
    //target为目标对象，source为被拷贝对象
    // function extend(target, source, deep) {
    //   for (key in source)
    //     if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
    //       if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
    //         target[key] = {}
    //       }
    //       if (isArray(source[key]) && !isArray(target[key])) {
    //         target[key] = []
    //         extend(target[key], source[key], deep)
    //       }
    //     } else if (source[key] !== undefined) {
    //       target[key] = source[key]
    //     }
    // }

    //对象深浅拷贝，deep==true为深拷贝  deep==flase为浅拷贝
    //target为目标对象，source为被拷贝对象
    //由于源码中extend方法在进行深拷贝的时候，并不会将目标对象中的子对象进行拷贝(如果target和source有key相同的子对象)，故将extend方法改进如下
    function extend(target, source, deep) {
      for (key in source)
        if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
          if (isPlainObject(source[key])) {
            // target[key] = {}
            if (!isPlainObject(target[key])) {
              target[key] = {}
              target[key] = source[key]
            } else {
              extend(target[key], source[key], deep)
            }
          }
          //？？？对 对象的拷贝，不知为何要对其判断是否为数组形式？？？
          if (isArray(source[key]) && !isArray(target[key])) {
            target[key] = []
            extend(target[key], source[key], deep)
          }
        } else if (source[key] !== undefined) {
          target[key] = source[key]
        }
    }
    //如果target参数为空，则target对象默认为可以全局zepto对象添加新函数
    //$.extend(target, [source, [source2, ...]])
    //$.extend(true, target, [source, ...])
    $.extend = function(target) {
      //arguments 参数集合
      //args [true/false, target, obj1, obj2]
      var deep, args = slice.call(arguments, 1)//arguments不是真正的数组即伪数组，不具有数组的slice方法，[].slice.call(args, 1)让args具备slice数组分割方法
      //如果第一个参数为boolean类型，则是深拷贝
      //如果不需要深拷贝，第一个参数为目标对象target
      if (typeof target == 'boolean') {
        deep = target //将第一个参数赋值给deep
        target = args.shift() //截取集合第一个参数 赋值目标对象 target
      }
      args.forEach(function(arg) {
        extend(target, arg, deep) //source = arg [obj1, obj2...]
      })
      return target  //返回拷贝后的目标对象
    }

    //css选择器$('element')的实现
    zepto.qsa = function(element, selector) {
      var found,
        maybeID = selector[0] == '#', //判断选择器可能为id选择器
        maybeClass = !maybeID && selector[0] == '.', //判断选择器可能为class选择器
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, //去掉id或class的第一个字符'#','.'
        isSimple = simpleSelectorRE.test(nameOnly) //simpleSelectorRE = /^[\w-]*$/ 判断是否为单选择器'.class' 并非'.class1 .class2'
      return (element.getElementById && isSimple && maybeID) ? //存在getElementById方法，单选择器，id选择器
        ((found = element.getElementById(nameOnly)) ? [found] : []) : //找到元素返回以数组形式返回，没找到返回空数组
        (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] : //不符合这几种节点类型，返回空数组
        //id选择器是唯一的，所以没有用slice.call处理
        //class,tag...可以不是唯一的，集合是类数组形式，用slice.call可以直接使用数组的方法
        slice.call(
          isSimple && !maybeID && element.getElementsByClassName ?
          //单选择器 + 不为id + 有getElementsByClassName方法，执行下面的三元式
          maybeClass ? element.getElementsByClassName(nameOnly) : //class选择器
          element.getElementsByTagName(selector) : //标签选择器
          //上面条件false,直接用querySelectorAll获取dom节点
          element.querySelectorAll(selector) //
        )
    }
    //过滤集合中的指定选择器，调用的是filter方法(注：这里的filter不是数组原生方法)
    function filtered(nodes, selector) {
      return selector == null ? $(nodes) : $(nodes).filter(selector)
    }

    //检查父节点是否包含给定的dom节点
    //检查浏览器是否有contains方法，支持执行第一个匿名函数，不支持执行第二个匿名函数
    $.contains = document.documentElement.contains ?
      function(parent, node) {
        if (node) return parent !== node && parent.contains(node)
      } :
      function(parent, node) {
        while (node && (node = node.parentNode)) { //为什么要用循环判断
          if (node === parent) return true
        }
        //和这种方式有什么不同？
        // if (node && parent === node.parentNode) {
        //   return true
        // }
        return false
      }

    function funcArg(context, arg, idx, payload) {
      return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString
    function className(node, value) {
      var klass = node.className || '',
        svg = klass && klass.baseVal !== undefined

      if (value === undefined) return svg ? klass.baseVal : klass
      svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // "08"    => "08"
    // JSON    => parse if valid
    // String  => self
    function deserializeValue(value) {
      try {
        return value ?
          value == "true" ||
          (value == "false" ? false :
            value == "null" ? null :
            +value + "" == value ? +value :
            /^[\[\{]/.test(value) ? $.parseJSON(value) :
            value) : value
      } catch (e) {
        return value
      }
    }

    $.type = type //获取数据类型
    $.isFunction = isFunction //判断是否为函数
    $.isWindow = isWindow //是否为浏览器的 window 对象
    $.isArray = isArray //判断是否为数组
    $.isPlainObject = isPlainObject //判断是否为纯对象

    $.isEmptyObject = function(obj) {
      var name
      for (name in obj) {
        return false
      }
      return true
    }

    //判断是否是数值
    $.isNumeric = function(val) {
      var num = Number(val),
        type = typeof val
      return val != null && type != 'boolean' &&
        (type != 'string' || val.length) &&
        !isNaN(num) && isFinite(num) || false
    }

    //指定元素在数组中的索引值，数组的indexOf方法
    $.inArray = function(elem, array, i) {
      return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize //将字符串转为驼峰式
    //调用原生方法，去除首尾空格
    $.trim = function(str) {
      return str == null ? "" : String.prototype.trim.call(str)
    }

    // plugin compatibility
    $.uuid = 0
    $.support = {}
    $.expr = {}
    $.noop = function() {} //空函数

    // ?模糊点? 对数组扁平化的处理，多层降维
    // $.fn.concat.apply([], [1,2,3,4,[5,6,[8,9]]]) => [].concat(1,2,3,4,[5,6,[8,9]])
    function flatten(array) {
      return array.length > 0 ? $.fn.concat.apply([], array) : array
    }
    //$.map  对类数组或对象进行遍历，并返回一个新的数组，剔除null,undefined
    // $.map([1,2,3,4,5],function(item,index){
    //     if(item>1){return item*item;}
    // }); => [4,9,16,25]
    $.map = function(elements, callback) {
      var value, values = [],
        i, key
        //遍历类数组
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++) {
          value = callback(elements[i], i)
          if (value != null) values.push(value)
        }
      } else {
        //遍历对象
        for (key in elements) {
          value = callback(elements[key], key)
          if (value != null) values.push(value)
        }
      }
      return flatten(values)
    }

    //遍历数组 或 对象
    $.each = function(elements, callback) {
      var i, key
      //类数组形式
      if (likeArray(elements)) {
        for (i = 0; i < elements.length; i++) {
          //fun.call(thisArg, arg1, arg2, ...)
          //将第一个参数elements[i]作为指定的this,使得回调函数callback上下文中的this指向elements[i]
          //如果回调函数返回值为false, 跳出循环,中断遍历
          if (callback.call(elements[i], i, elements[i]) === false) {
            return elements
          }
        }
      } else {
        //对象形式
        for (key in elements) {
          if (callback.call(elements[key], key, elements[key]) === false) {
            return elements
          }
        }
      }
      return elements
    }

    //数组的filter方法, 返回一个新数组，数组只包含回调函数返回值为true的数组项
    $.grep = function(elements, callback) {
      return filter.call(elements, callback)
    }

    if (window.JSON) $.parseJSON = JSON.parse //JSON字符串转JSON

    // Populate the class2type map
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
      class2type["[object " + name + "]"] = name.toLowerCase()
    })

    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
      constructor: zepto.Z,
      length: 0,
      forEach: emptyArray.forEach,  //数组的forEach方法
      //arr.reduce((accumulator, currentValue, currentIndex, arr) => ... , initialValue)
      /**
        accumulator 累加回调的返回值, 上一次调用回调时返回的累积值
        currentValue 数组中当前正在处理的元素
        currentIndex  数组中当前正在处理的元素的索引
        array 调用reduce的数组
        initialValue  第一个调用回调函数第一个参数的值
       */
      reduce: emptyArray.reduce,   //数组的reduce方法
      push: emptyArray.push,  //数组的push方法
      sort: emptyArray.sort,  //数组的sort方法
      splice: emptyArray.splice,  //数组的splice方法
      indexOf: emptyArray.indexOf,  //数组的indexOf方法
      //合并zepto的数组集合，console.log(ele.concat($('.obj'))) 返回的是普通dom数组集合
      concat: function() {
        var i, value, args = []
        //arguments => $('.obj')
        for (i = 0; i < arguments.length; i++) {
          value = arguments[i]
          //判断value 是否为zepto对象
          args[i] = zepto.isZ(value) ? value.toArray() : value
        }
        //args => $('.obj')中的dom节点[0...]即我们说的集合伪数组
        return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
      },

      //$(ele).map((index, item) => ...)
      map: function(fn) {
        return $($.map(this, function(el, i) {
          //call 的第一个参数为 el ，因此可以在 map 的回调中通过 this 来拿到每个元素
          return fn.call(el, i, el)
        }))
      },
      //截取数组，对数组进行浅拷贝，再返回zepto对象
      slice: function() {
        return $(slice.apply(this, arguments))
      },
      //监听dom加载完毕后
      ready: function(callback) {
        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body element
        if (readyRE.test(document.readyState) && document.body) callback($)
        else document.addEventListener('DOMContentLoaded', function() {
          callback($)
        }, false)
        return this
      },
      /**
       * 从当前对象集合中获取所有元素或单个
       * @param   idx  索引值
       * idx 为空，普通数组的方式返回所有的元素  inx可以为负值
       * 与eq()不同，get()只是返回dom节点， eq()返回的是zepto对象集合
       */
      get: function(idx) {
        return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
      },
      //将集合返回的类数组通过get()方法变为真正的数组
      toArray: function() {
        return this.get()
      },
      //返回对象集合中的length，元素个数
      size: function() {
        return this.length
      },
      //从其父元素移除某个dom元素
      remove: function() {
        return this.each(function() {
          if (this.parentNode != null)
            this.parentNode.removeChild(this)
        })
      },
      //emptyArray.every  遍历数组的每个元素对于回调函数的条件是否全都通过
      //each循环  回调函数返回flase, 结束遍历
      each: function(callback) {
        emptyArray.every.call(this, function(el, idx) {
          return callback.call(el, idx, el) !== false
        })
        return this
      },
      //将集合中符合条件的元素过滤出来
      filter: function(selector) {
        //如果selector为函数，先筛选出需要排除的元素this.not(selector)，再对排除出来的元素进行取反this.not(this.not(selector))
        if (isFunction(selector)) return this.not(this.not(selector))
        return $(filter.call(this, function(element) {
          //返回filter回调函数返回值为true的值
          return zepto.matches(element, selector)
        }))
      },
      //添加元素到当前匹配的元素集合中。如果给定content参数，将只在content元素中进行查找，否则在整个document中查找。
      //uniq 数组去重  concat 合并zepto集合的类数组
      //$(ele).add(anotherEle)
      add: function(selector, context) {
        return $(uniq(this.concat($(selector, context))))
      },
      //判断集合的第一个元素是否匹配selector
      is: function(selector) {
        return this.length > 0 && zepto.matches(this[0], selector)
      },
      //将集合中不符合条件的元素过滤出来,参数可以为：css选择器, function, dom, nodeList
      not: function(selector) {
        //被过滤的数组集合
        var nodes = []
        //selector为函数时，为防止有些浏览器(早期safari下 typeof nodeList也会判断为function)会对typeof兼容问题，这里又加了个selector是否有call方法
        if (isFunction(selector) && selector.call !== undefined)
          this.each(function(idx) {
            //selector.call(this, idx)值为false时，将过滤元素放入nodes数组中
            if (!selector.call(this, idx)) nodes.push(this)
          })
        else {
          //如果selector为string,则筛选出集合中符合条件的元素
          var excludes = typeof selector == 'string' ? this.filter(selector) :
          //如果selector为nodeList 类数组形式，则把selector转为数组形式slice.call(selector)
          //???? isFunction(selector.item)这里这样写的原因暂不清楚？？？
          //如果selector为css选择器的话，则直接获取$(selector)
            (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
          this.forEach(function(el) {
            //遍历集合，筛选出excludes中不存在的元素
            if (excludes.indexOf(el) < 0) nodes.push(el)
          })
        }
        //以zepto对象形式返回筛选过滤后的元素
        return $(nodes)
      },
      //判断当前对象集合是否有符合选择器的元素，有的话就返回不包含有选择器元素的对象集合
      has: function(selector) {
        return this.filter(function() {
          //如果selector为对象集合，执行$.contains(this, selector),返回true的话，当前filter回调也返回true
          return isObject(selector) ?
            $.contains(this, selector) :
            //如果selector为string 节点 或 css选择器的话，返回该selector集合length, length>0为true, length==0为false
            $(this).find(selector).size()
        })
      },
      //获取集合中指定索引的元素
      eq: function(idx) {
        //如果索引为-1的话，查找并截取集合中最后一个数组元素
        //否则，查找截取指定索引元素
        //this.slice(idx, +idx + 1)  +idx + 1 若idx为'2'number string +idx可将idx隐式转换为number
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
      },
      //获取集合的第一个元素
      first: function() {
        //el = this.eq(0) 或者 el = this.slice(0,1)
        var el = this[0]
        return el && !isObject(el) ? el : $(el)
      },
      //获取集合的最后一个元素
      last: function() {
        var el = this[this.length - 1]
        return el && !isObject(el) ? el : $(el)
      },
      //在当前集合中查找符合selector的后代元素，参数为 集合，选择器，节点
      find: function(selector) {
        var result, $this = this
        //如果参数为空，返回空对象
        if (!selector) result = $()
          //如果selector为zepto对象集合
        else if (typeof selector == 'object')
          result = $(selector).filter(function() {
            var node = this
            //emptyArray.some(callback)测试数组中的每个元素是否符合条件，如果全部符合则返回true, 如果有一个不符合则返回false
            // callback参数为ele,index, array ele为循环的每个元素，index为索引，array为原数组
            return emptyArray.some.call($this, function(parent) {
              //此处parent为数组循环出来的每个元素，node为selector
              //如果parent包含有selector,返回true,则some回调也返回true, 则当前filter回调返回true
              return $.contains(parent, node)
            })
          })
        //如果selector为css选择器
        //如果当前集合length==1即$(parent).find('.onlyOneSelector')
        else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
          //如果当前集合length>1即$(parent).find('.moreSelector'),调用map，直接返回zepto对象数组形式
        else result = this.map(function() {
          return zepto.qsa(this, selector)
        })
        return result
      },
      //查找离当前集合元素最近的满足条件的父级元素,参数为对象集合，节点，选择器
      closest: function(selector, context) {
        var nodes = [],
          //判断selector是否为zepto对象集合, 再统一转化为zepto对象
          collection = typeof selector == "object" && $(selector)
        this.each(function(_, node) {
          while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
            node = node !== context && !isDocument(node) && node.parentNode
          if (node && nodes.indexOf(node) < 0) nodes.push(node)
        })
        return $(nodes)
      },
      //查找当前集合元素所有的祖先元素(如果只想获取第一个符合选择器的元素，可以使用closest())
      //参数selector为空的话，返回所有的祖先元素；不为空时，则返回当前指定的选择器selector
      parents: function(selector) {
        var ancestors = [],
          nodes = this  //初始值为当前集合，每次map循环完后，nodes值为自身的最近父级元素
          //直到所有的父级元素找到后，跳出循环
        while (nodes.length > 0)
          nodes = $.map(nodes, function(node) {
            //将node父级元素赋值给node自身，node不是decument类型并且ancestors中没有node
            if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
              ancestors.push(node) //将node保存在ancestors数组内
              return node
            }
          })
        //filtered方法过滤ancestors，找到符合指定选择器的祖先元素
        return filtered(ancestors, selector)
      },
      //获取对象集合中元素的直接父级元素（参数可为空）
      parent: function(selector) {
        //this.pluck('parentNode') 得到对象集合中每个元素的parentNode节点
        //uniq(this.pluck('parentNode')  再对其进行去重操作
        //最后过滤出符合条件的元素
        return filtered(uniq(this.pluck('parentNode')), selector)
      },
      //返回对象集合中所有的子元素，通过调用内部children方法
      children: function(selector) {
        return filtered(this.map(function() {
          return children(this)
        }), selector)
      },
      //返回对象集合的所有子节点元素(包括文本节点，注释节点，元素节点)
      //children()方法是对childNodes进行了判断，只筛选出所有子节点元素的元素节点
      contents: function() {
        return this.map(function() {
          //contentDocument是iframe内部属性
          return this.contentDocument || slice.call(this.childNodes)
        })
      },
      //查找对象集合元素的兄弟节点
      siblings: function(selector) {
        return filtered(this.map(function(i, el) {
          //对 对象集合元素父级节点的子节点筛选出子元素不为当前集合元素的其他子元素
          return filter.call(children(el.parentNode), function(child) {
            return child !== el
          })
        }), selector)
      },
      empty: function() {
        return this.each(function() {
          this.innerHTML = ''
        })
      },
      //对当前集合遍历，返回元素指定属性的数组
      pluck: function(property) {
        return $.map(this, function(el) {
          return el[property]
        })
      },
      show: function() {
        return this.each(function() {
          this.style.display == "none" && (this.style.display = '')
          if (getComputedStyle(this, '').getPropertyValue("display") == "none")
            this.style.display = defaultDisplay(this.nodeName)
        })
      },
      replaceWith: function(newContent) {
        return this.before(newContent).remove()
      },
      wrap: function(structure) {
        var func = isFunction(structure)
        if (this[0] && !func)
          var dom = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

        return this.each(function(index) {
          $(this).wrapAll(
            func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
          )
        })
      },
      wrapAll: function(structure) {
        if (this[0]) {
          $(this[0]).before(structure = $(structure))
          var children
            // drill down to the inmost element
          while ((children = structure.children()).length) structure = children.first()
          $(structure).append(this)
        }
        return this
      },
      wrapInner: function(structure) {
        var func = isFunction(structure)
        return this.each(function(index) {
          var self = $(this),
            contents = self.contents(),
            dom = func ? structure.call(this, index) : structure
          contents.length ? contents.wrapAll(dom) : self.append(dom)
        })
      },
      unwrap: function() {
        this.parent().each(function() {
          $(this).replaceWith($(this).children())
        })
        return this
      },
      clone: function() {
        return this.map(function() {
          return this.cloneNode(true)
        })
      },
      hide: function() {
        return this.css("display", "none")
      },
      toggle: function(setting) {
        return this.each(function() {
          var el = $(this);
          (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
        })
      },
      //获取对象集合中元素的前一个兄弟节点
      //previousElementSibling 与 previousSibling的区别
      prev: function(selector) {
        //previousElementSibling 获取上一个兄弟节点元素
      //previousSibling  获取上一个兄弟节点（元素节点，文本节点，注释节点）
        return $(this.pluck('previousElementSibling')).filter(selector || '*')
      },
      //获取对象集合中元素的下一个兄弟节点
      next: function(selector) {
        return $(this.pluck('nextElementSibling')).filter(selector || '*')
      },
      html: function(html) {
        return 0 in arguments ?
          this.each(function(idx) {
            var originHtml = this.innerHTML
            $(this).empty().append(funcArg(this, html, idx, originHtml))
          }) :
          (0 in this ? this[0].innerHTML : null)
      },
      text: function(text) {
        return 0 in arguments ?
          this.each(function(idx) {
            var newText = funcArg(this, text, idx, this.textContent)
            this.textContent = newText == null ? '' : '' + newText
          }) :
          (0 in this ? this.pluck('textContent').join("") : null)
      },
      attr: function(name, value) {
        var result
        return (typeof name == 'string' && !(1 in arguments)) ?
          (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
          this.each(function(idx) {
            if (this.nodeType !== 1) return
            if (isObject(name))
              for (key in name) setAttribute(this, key, name[key])
            else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
          })
      },
      removeAttr: function(name) {
        return this.each(function() {
          this.nodeType === 1 && name.split(' ').forEach(function(attribute) {
            setAttribute(this, attribute)
          }, this)
        })
      },
      prop: function(name, value) {
        name = propMap[name] || name
        return (1 in arguments) ?
          this.each(function(idx) {
            this[name] = funcArg(this, value, idx, this[name])
          }) :
          (this[0] && this[0][name])
      },
      removeProp: function(name) {
        name = propMap[name] || name
        return this.each(function() {
          delete this[name]
        })
      },
      data: function(name, value) {
        var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

        var data = (1 in arguments) ?
          this.attr(attrName, value) :
          this.attr(attrName)

        return data !== null ? deserializeValue(data) : undefined
      },
      val: function(value) {
        if (0 in arguments) {
          if (value == null) value = ""
          return this.each(function(idx) {
            this.value = funcArg(this, value, idx, this.value)
          })
        } else {
          return this[0] && (this[0].multiple ?
            $(this[0]).find('option').filter(function() {
              return this.selected
            }).pluck('value') :
            this[0].value)
        }
      },
      offset: function(coordinates) {
        if (coordinates) return this.each(function(index) {
          var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top: coords.top - parentOffset.top,
              left: coords.left - parentOffset.left
            }

          if ($this.css('position') == 'static') props['position'] = 'relative'
          $this.css(props)
        })
        if (!this.length) return null
        if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
          return {
            top: 0,
            left: 0
          }
        var obj = this[0].getBoundingClientRect()
        return {
          left: obj.left + window.pageXOffset,
          top: obj.top + window.pageYOffset,
          width: Math.round(obj.width),
          height: Math.round(obj.height)
        }
      },
      css: function(property, value) {
        if (arguments.length < 2) {
          var element = this[0]
          if (typeof property == 'string') {
            if (!element) return
            return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
          } else if (isArray(property)) {
            if (!element) return
            var props = {}
            var computedStyle = getComputedStyle(element, '')
            $.each(property, function(_, prop) {
              props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
            })
            return props
          }
        }

        var css = ''
        if (type(property) == 'string') {
          if (!value && value !== 0)
            this.each(function() {
              this.style.removeProperty(dasherize(property))
            })
          else
            css = dasherize(property) + ":" + maybeAddPx(property, value)
        } else {
          for (key in property)
            if (!property[key] && property[key] !== 0)
              this.each(function() {
                this.style.removeProperty(dasherize(key))
              })
            else
              css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
        }

        return this.each(function() {
          this.style.cssText += ';' + css
        })
      },
      //返回指定元素在当前集合中的位置即索引值
      index: function(element) {
        //如果给定参数元素 执行this.indexOf($(element)[0])
        //如果参数为空，执行this.parent().children().indexOf(this[0]) 当前集合在其兄弟元素中的位置
        return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
      },
      hasClass: function(name) {
        if (!name) return false
        return emptyArray.some.call(this, function(el) {
          return this.test(className(el))
        }, classRE(name))
      },
      addClass: function(name) {
        if (!name) return this
        return this.each(function(idx) {
          if (!('className' in this)) return
          classList = []
          var cls = className(this),
            newName = funcArg(this, name, idx, cls)
          newName.split(/\s+/g).forEach(function(klass) {
            if (!$(this).hasClass(klass)) classList.push(klass)
          }, this)
          classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
        })
      },
      removeClass: function(name) {
        return this.each(function(idx) {
          if (!('className' in this)) return
          if (name === undefined) return className(this, '')
          classList = className(this)
          funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
            classList = classList.replace(classRE(klass), " ")
          })
          className(this, classList.trim())
        })
      },
      toggleClass: function(name, when) {
        if (!name) return this
        return this.each(function(idx) {
          var $this = $(this),
            names = funcArg(this, name, idx, className(this))
          names.split(/\s+/g).forEach(function(klass) {
            (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass): $this.removeClass(klass)
          })
        })
      },
      scrollTop: function(value) {
        if (!this.length) return
        var hasScrollTop = 'scrollTop' in this[0]
        if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
        return this.each(hasScrollTop ?
          function() {
            this.scrollTop = value
          } :
          function() {
            this.scrollTo(this.scrollX, value)
          })
      },
      scrollLeft: function(value) {
        if (!this.length) return
        var hasScrollLeft = 'scrollLeft' in this[0]
        if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
        return this.each(hasScrollLeft ?
          function() {
            this.scrollLeft = value
          } :
          function() {
            this.scrollTo(value, this.scrollY)
          })
      },
      position: function() {
        if (!this.length) return

        var elem = this[0],
          // Get *real* offsetParent
          offsetParent = this.offsetParent(),
          // Get correct offsets
          offset = this.offset(),
          parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
            top: 0,
            left: 0
          } : offsetParent.offset()

        // Subtract element margins
        // note: when an element has margin: auto the offsetLeft and marginLeft
        // are the same in Safari causing offset.left to incorrectly be 0
        offset.top -= parseFloat($(elem).css('margin-top')) || 0
        offset.left -= parseFloat($(elem).css('margin-left')) || 0

        // Add offsetParent borders
        parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
        parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

        // Subtract the two offsets
        return {
          top: offset.top - parentOffset.top,
          left: offset.left - parentOffset.left
        }
      },
      offsetParent: function() {
        return this.map(function() {
          var parent = this.offsetParent || document.body
          while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
            parent = parent.offsetParent
          return parent
        })
      }
    }

    // for now
    $.fn.detach = $.fn.remove

    // Generate the `width` and `height` functions
    ;
    ['width', 'height'].forEach(function(dimension) {
      var dimensionProperty =
        dimension.replace(/./, function(m) {
          return m[0].toUpperCase()
        })

      $.fn[dimension] = function(value) {
        var offset, el = this[0]
        if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
          isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
          (offset = this.offset()) && offset[dimension]
        else return this.each(function(idx) {
          el = $(this)
          el.css(dimension, funcArg(this, value, idx, el[dimension]()))
        })
      }
    })

    function traverseNode(node, fun) {
      fun(node)
      for (var i = 0, len = node.childNodes.length; i < len; i++)
        traverseNode(node.childNodes[i], fun)
    }

    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function(operator, operatorIndex) {
      var inside = operatorIndex % 2 //=> prepend, append

      $.fn[operator] = function() {
        // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
        var argType, nodes = $.map(arguments, function(arg) {
            var arr = []
            argType = type(arg)
            if (argType == "array") {
              arg.forEach(function(el) {
                if (el.nodeType !== undefined) return arr.push(el)
                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                arr = arr.concat(zepto.fragment(el))
              })
              return arr
            }
            return argType == "object" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
        if (nodes.length < 1) return this

        return this.each(function(_, target) {
          parent = inside ? target : target.parentNode

          // convert all methods to a "before" operation
          target = operatorIndex == 0 ? target.nextSibling :
            operatorIndex == 1 ? target.firstChild :
            operatorIndex == 2 ? target :
            null

          var parentInDocument = $.contains(document.documentElement, parent)

          nodes.forEach(function(node) {
            if (copyByClone) node = node.cloneNode(true)
            else if (!parent) return $(node).remove()

            parent.insertBefore(node, target)
            if (parentInDocument) traverseNode(node, function(el) {
              if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                (!el.type || el.type === 'text/javascript') && !el.src) {
                var target = el.ownerDocument ? el.ownerDocument.defaultView : window
                target['eval'].call(target, el.innerHTML)
              }
            })
          })
        })
      }

      // after    => insertAfter
      // prepend  => prependTo
      // before   => insertBefore
      // append   => appendTo
      $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
        $(html)[operator](this)
        return this
      }
    })

    zepto.Z.prototype = Z.prototype = $.fn

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto

    return $
  })()

  window.Zepto = Zepto
  window.$ === undefined && (window.$ = Zepto)

  ;
  (function($) {
    var _zid = 1,
      undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj) {
        return typeof obj == 'string'
      },
      handlers = {},
      specialEvents = {},
      focusinSupported = 'onfocusin' in window,
      focus = {
        focus: 'focusin',
        blur: 'focusout'
      },
      hover = {
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
      }

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

    function zid(element) {
      return element._zid || (element._zid = _zid++)
    }

    function findHandlers(element, event, fn, selector) {
      event = parse(event)
      if (event.ns) var matcher = matcherFor(event.ns)
      return (handlers[zid(element)] || []).filter(function(handler) {
        return handler && (!event.e || handler.e == event.e) && (!event.ns || matcher.test(handler.ns)) && (!fn || zid(handler.fn) === zid(fn)) && (!selector || handler.sel == selector)
      })
    }

    function parse(event) {
      var parts = ('' + event).split('.')
      return {
        e: parts[0],
        ns: parts.slice(1).sort().join(' ')
      }
    }

    function matcherFor(ns) {
      return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }

    function eventCapture(handler, captureSetting) {
      return handler.del &&
        (!focusinSupported && (handler.e in focus)) ||
        !!captureSetting
    }

    function realEvent(type) {
      return hover[type] || (focusinSupported && focus[type]) || type
    }

    function add(element, events, fn, data, selector, delegator, capture) {
      var id = zid(element),
        set = (handlers[id] || (handlers[id] = []))
      events.split(/\s/).forEach(function(event) {
        if (event == 'ready') return $(document).ready(fn)
        var handler = parse(event)
        handler.fn = fn
        handler.sel = selector
          // emulate mouseenter, mouseleave
        if (handler.e in hover) fn = function(e) {
          var related = e.relatedTarget
          if (!related || (related !== this && !$.contains(this, related)))
            return handler.fn.apply(this, arguments)
        }
        handler.del = delegator
        var callback = delegator || fn
        handler.proxy = function(e) {
          e = compatible(e)
          if (e.isImmediatePropagationStopped()) return
          e.data = data
          var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
          if (result === false) e.preventDefault(), e.stopPropagation()
          return result
        }
        handler.i = set.length
        set.push(handler)
        if ('addEventListener' in element)
          element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    }

    function remove(element, events, fn, selector, capture) {
      var id = zid(element);
      (events || '').split(/\s/).forEach(function(event) {
        findHandlers(element, event, fn, selector).forEach(function(handler) {
          delete handlers[id][handler.i]
          if ('removeEventListener' in element)
            element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
      })
    }

    $.event = {
      add: add,
      remove: remove
    }

    $.proxy = function(fn, context) {
      var args = (2 in arguments) && slice.call(arguments, 2)
      if (isFunction(fn)) {
        var proxyFn = function() {
          return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments)
        }
        proxyFn._zid = zid(fn)
        return proxyFn
      } else if (isString(context)) {
        if (args) {
          args.unshift(fn[context], fn)
          return $.proxy.apply(null, args)
        } else {
          return $.proxy(fn[context], fn)
        }
      } else {
        throw new TypeError("expected function")
      }
    }

    $.fn.bind = function(event, data, callback) {
      return this.on(event, data, callback)
    }
    $.fn.unbind = function(event, callback) {
      return this.off(event, callback)
    }
    $.fn.one = function(event, selector, data, callback) {
      return this.on(event, selector, data, callback, 1)
    }

    var returnTrue = function() {
        return true
      },
      returnFalse = function() {
        return false
      },
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

    function compatible(event, source) {
      if (source || !event.isDefaultPrevented) {
        source || (source = event)

        $.each(eventMethods, function(name, predicate) {
          var sourceMethod = source[name]
          event[name] = function() {
            this[predicate] = returnTrue
            return sourceMethod && sourceMethod.apply(source, arguments)
          }
          event[predicate] = returnFalse
        })

        event.timeStamp || (event.timeStamp = Date.now())

        if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
          event.isDefaultPrevented = returnTrue
      }
      return event
    }

    function createProxy(event) {
      var key, proxy = {
        originalEvent: event
      }
      for (key in event)
        if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

      return compatible(proxy, event)
    }

    $.fn.delegate = function(selector, event, callback) {
      return this.on(event, selector, callback)
    }
    $.fn.undelegate = function(selector, event, callback) {
      return this.off(event, selector, callback)
    }

    $.fn.live = function(event, callback) {
      $(document.body).delegate(this.selector, event, callback)
      return this
    }
    $.fn.die = function(event, callback) {
      $(document.body).undelegate(this.selector, event, callback)
      return this
    }

    $.fn.on = function(event, selector, data, callback, one) {
      var autoRemove, delegator, $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn) {
          $this.on(type, selector, data, fn, one)
        })
        return $this
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = data, data = selector, selector = undefined
      if (callback === undefined || data === false)
        callback = data, data = undefined

      if (callback === false) callback = returnFalse

      return $this.each(function(_, element) {
        if (one) autoRemove = function(e) {
          remove(element, e.type, callback)
          return callback.apply(this, arguments)
        }

        if (selector) delegator = function(e) {
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match && match !== element) {
            evt = $.extend(createProxy(e), {
              currentTarget: match,
              liveFired: element
            })
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
          }
        }

        add(element, event, callback, data, selector, delegator || autoRemove)
      })
    }
    $.fn.off = function(event, selector, callback) {
      var $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn) {
          $this.off(type, selector, fn)
        })
        return $this
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = selector, selector = undefined

      if (callback === false) callback = returnFalse

      return $this.each(function() {
        remove(this, event, callback, selector)
      })
    }

    $.fn.trigger = function(event, args) {
      event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
      event._args = args
      return this.each(function() {
        // handle focus(), blur() by calling them directly
        if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
          // items in the collection might not be DOM elements
        else if ('dispatchEvent' in this) this.dispatchEvent(event)
        else $(this).triggerHandler(event, args)
      })
    }

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function(event, args) {
      var e, result
      this.each(function(i, element) {
        e = createProxy(isString(event) ? $.Event(event) : event)
        e._args = args
        e.target = element
        $.each(findHandlers(element, event.type || event), function(i, handler) {
          result = handler.proxy(e)
          if (e.isImmediatePropagationStopped()) return false
        })
      })
      return result
    }

    // shortcut methods for `.bind(event, fn)` for each event type
    ;
    ('focusin focusout focus blur load resize scroll unload click dblclick ' +
      'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
      'change select keydown keypress keyup error').split(' ').forEach(function(event) {
      $.fn[event] = function(callback) {
        return (0 in arguments) ?
          this.bind(event, callback) :
          this.trigger(event)
      }
    })

    $.Event = function(type, props) {
      if (!isString(type)) props = type, type = props.type
      var event = document.createEvent(specialEvents[type] || 'Events'),
        bubbles = true
      if (props)
        for (var name in props)(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
      event.initEvent(type, bubbles, true)
      return compatible(event)
    }

  })(Zepto)

  ;
  (function($) {
    var jsonpID = +new Date(),
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

    originAnchor.href = window.location.href

    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
      var event = $.Event(eventName)
      $(context).trigger(event, data)
      return !event.isDefaultPrevented()
    }

    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
      if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }

    // Number of active Ajax requests
    $.active = 0

    function ajaxStart(settings) {
      if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }

    function ajaxStop(settings) {
      if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
      var context = settings.context
      if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
        return false

      triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }

    function ajaxSuccess(data, xhr, settings, deferred) {
      var context = settings.context,
        status = 'success'
      settings.success.call(context, data, status, xhr)
      if (deferred) deferred.resolveWith(context, [data, status, xhr])
      triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
      ajaxComplete(status, xhr, settings)
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred) {
      var context = settings.context
      settings.error.call(context, xhr, type, error)
      if (deferred) deferred.rejectWith(context, [xhr, type, error])
      triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
      ajaxComplete(type, xhr, settings)
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
      var context = settings.context
      settings.complete.call(context, xhr, status)
      triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
      ajaxStop(settings)
    }

    function ajaxDataFilter(data, type, settings) {
      if (settings.dataFilter == empty) return data
      var context = settings.context
      return settings.dataFilter.call(context, data, type)
    }

    // Empty function, used as default callback
    function empty() {}

    $.ajaxJSONP = function(options, deferred) {
      if (!('type' in options)) return $.ajax(options)

      var _callbackName = options.jsonpCallback,
        callbackName = ($.isFunction(_callbackName) ?
          _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
        script = document.createElement('script'),
        originalCallback = window[callbackName],
        responseData,
        abort = function(errorType) {
          $(script).triggerHandler('error', errorType || 'abort')
        },
        xhr = {
          abort: abort
        },
        abortTimeout

      if (deferred) deferred.promise(xhr)

      $(script).on('load error', function(e, errorType) {
        clearTimeout(abortTimeout)
        $(script).off().remove()

        if (e.type == 'error' || !responseData) {
          ajaxError(null, errorType || 'error', xhr, options, deferred)
        } else {
          ajaxSuccess(responseData[0], xhr, options, deferred)
        }

        window[callbackName] = originalCallback
        if (responseData && $.isFunction(originalCallback))
          originalCallback(responseData[0])

        originalCallback = responseData = undefined
      })

      if (ajaxBeforeSend(xhr, options) === false) {
        abort('abort')
        return xhr
      }

      window[callbackName] = function() {
        responseData = arguments
      }

      script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
      document.head.appendChild(script)

      if (options.timeout > 0) abortTimeout = setTimeout(function() {
        abort('timeout')
      }, options.timeout)

      return xhr
    }

    $.ajaxSettings = {
      // Default type of request
      type: 'GET',
      // Callback that is executed before request
      beforeSend: empty,
      // Callback that is executed if the request succeeds
      success: empty,
      // Callback that is executed the the server drops error
      error: empty,
      // Callback that is executed on request complete (both: error and success)
      complete: empty,
      // The context for the callbacks
      context: null,
      // Whether to trigger "global" Ajax events
      global: true,
      // Transport
      xhr: function() {
        return new window.XMLHttpRequest()
      },
      // MIME types mapping
      // IIS returns Javascript as "application/x-javascript"
      accepts: {
        script: 'text/javascript, application/javascript, application/x-javascript',
        json: jsonType,
        xml: 'application/xml, text/xml',
        html: htmlType,
        text: 'text/plain'
      },
      // Whether the request is to another domain
      crossDomain: false,
      // Default timeout
      timeout: 0,
      // Whether data should be serialized to string
      processData: true,
      // Whether the browser should be allowed to cache GET responses
      cache: true,
      //Used to handle the raw response data of XMLHttpRequest.
      //This is a pre-filtering function to sanitize the response.
      //The sanitized response should be returned
      dataFilter: empty
    }

    function mimeToDataType(mime) {
      if (mime) mime = mime.split(';', 2)[0]
      return mime && (mime == htmlType ? 'html' :
        mime == jsonType ? 'json' :
        scriptTypeRE.test(mime) ? 'script' :
        xmlTypeRE.test(mime) && 'xml') || 'text'
    }

    function appendQuery(url, query) {
      if (query == '') return url
      return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
      if (options.processData && options.data && $.type(options.data) != "string")
        options.data = $.param(options.data, options.traditional)
      if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
        options.url = appendQuery(options.url, options.data), options.data = undefined
    }

    $.ajax = function(options) {
      var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor, hashIndex
      for (key in $.ajaxSettings)
        if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

      ajaxStart(settings)

      if (!settings.crossDomain) {
        urlAnchor = document.createElement('a')
        urlAnchor.href = settings.url
          // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
        urlAnchor.href = urlAnchor.href
        settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
      }

      if (!settings.url) settings.url = window.location.toString()
      if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)
      serializeData(settings)

      var dataType = settings.dataType,
        hasPlaceholder = /\?.+=\?/.test(settings.url)
      if (hasPlaceholder) dataType = 'jsonp'

      if (settings.cache === false || (
          (!options || options.cache !== true) &&
          ('script' == dataType || 'jsonp' == dataType)
        ))
        settings.url = appendQuery(settings.url, '_=' + Date.now())

      if ('jsonp' == dataType) {
        if (!hasPlaceholder)
          settings.url = appendQuery(settings.url,
            settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
        return $.ajaxJSONP(settings, deferred)
      }

      var mime = settings.accepts[dataType],
        headers = {},
        setHeader = function(name, value) {
          headers[name.toLowerCase()] = [name, value]
        },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

      if (deferred) deferred.promise(xhr)

      if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
      setHeader('Accept', mime || '*/*')
      if (mime = settings.mimeType || mime) {
        if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
        xhr.overrideMimeType && xhr.overrideMimeType(mime)
      }
      if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
        setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

      if (settings.headers)
        for (name in settings.headers) setHeader(name, settings.headers[name])
      xhr.setRequestHeader = setHeader

      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty
          clearTimeout(abortTimeout)
          var result, error = false
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
            dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))

            if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
              result = xhr.response
            else {
              result = xhr.responseText

              try {
                // http://perfectionkills.com/global-eval-what-are-the-options/
                // sanitize response accordingly if data filter callback provided
                result = ajaxDataFilter(result, dataType, settings)
                if (dataType == 'script')(1, eval)(result)
                else if (dataType == 'xml') result = xhr.responseXML
                else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
              } catch (e) {
                error = e
              }

              if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
            }

            ajaxSuccess(result, xhr, settings, deferred)
          } else {
            ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
          }
        }
      }

      if (ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort()
        ajaxError(null, 'abort', xhr, settings, deferred)
        return xhr
      }

      var async = 'async' in settings ? settings.async : true
      xhr.open(settings.type, settings.url, async, settings.username, settings.password)

      if (settings.xhrFields)
        for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

      for (name in headers) nativeSetHeader.apply(xhr, headers[name])

      if (settings.timeout > 0) abortTimeout = setTimeout(function() {
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

      // avoid sending empty string (#319)
      xhr.send(settings.data ? settings.data : null)
      return xhr
    }

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
      if ($.isFunction(data)) dataType = success, success = data, data = undefined
      if (!$.isFunction(success)) dataType = success, success = undefined
      return {
        url: url,
        data: data,
        success: success,
        dataType: dataType
      }
    }

    $.get = function( /* url, data, success, dataType */ ) {
      return $.ajax(parseArguments.apply(null, arguments))
    }

    $.post = function( /* url, data, success, dataType */ ) {
      var options = parseArguments.apply(null, arguments)
      options.type = 'POST'
      return $.ajax(options)
    }

    $.getJSON = function( /* url, data, success */ ) {
      var options = parseArguments.apply(null, arguments)
      options.dataType = 'json'
      return $.ajax(options)
    }

    $.fn.load = function(url, data, success) {
      if (!this.length) return this
      var self = this,
        parts = url.split(/\s/),
        selector,
        options = parseArguments(url, data, success),
        callback = options.success
      if (parts.length > 1) options.url = parts[0], selector = parts[1]
      options.success = function(response) {
        self.html(selector ?
          $('<div>').html(response.replace(rscript, "")).find(selector) : response)
        callback && callback.apply(self, arguments)
      }
      $.ajax(options)
      return this
    }

    var escape = encodeURIComponent

    function serialize(params, obj, traditional, scope) {
      var type, array = $.isArray(obj),
        hash = $.isPlainObject(obj)
      $.each(obj, function(key, value) {
        type = $.type(value)
        if (scope) key = traditional ? scope :
          scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
          // handle data in serializeArray() format
        if (!scope && array) params.add(value.name, value.value)
          // recurse into nested objects
        else if (type == "array" || (!traditional && type == "object"))
          serialize(params, value, traditional, key)
        else params.add(key, value)
      })
    }

    $.param = function(obj, traditional) {
      var params = []
      params.add = function(key, value) {
        if ($.isFunction(value)) value = value()
        if (value == null) value = ""
        this.push(escape(key) + '=' + escape(value))
      }
      serialize(params, obj, traditional)
      return params.join('&').replace(/%20/g, '+')
    }
  })(Zepto)

  ;
  (function($) {
    $.fn.serializeArray = function() {
      var name, type, result = [],
        add = function(value) {
          if (value.forEach) return value.forEach(add)
          result.push({
            name: name,
            value: value
          })
        }
      if (this[0]) $.each(this[0].elements, function(_, field) {
        type = field.type, name = field.name
        if (name && field.nodeName.toLowerCase() != 'fieldset' &&
          !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
          ((type != 'radio' && type != 'checkbox') || field.checked))
          add($(field).val())
      })
      return result
    }

    $.fn.serialize = function() {
      var result = []
      this.serializeArray().forEach(function(elm) {
        result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
      })
      return result.join('&')
    }

    $.fn.submit = function(callback) {
      if (0 in arguments) this.bind('submit', callback)
      else if (this.length) {
        var event = $.Event('submit')
        this.eq(0).trigger(event)
        if (!event.isDefaultPrevented()) this.get(0).submit()
      }
      return this
    }

  })(Zepto)

  ;
  (function() {
    // getComputedStyle shouldn't freak out when called
    // without a valid element as argument
    try {
      getComputedStyle(undefined)
    } catch (e) {
      var nativeGetComputedStyle = getComputedStyle
      window.getComputedStyle = function(element, pseudoElement) {
        try {
          return nativeGetComputedStyle(element, pseudoElement)
        } catch (e) {
          return null
        }
      }
    }
  })()
  return Zepto
}))
