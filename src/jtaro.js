/* global define */
;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory()
  : typeof define === 'function' && define.amd ? define(factory)
  : (global.JTaro = factory())
}(this, function () {
  'use strict'

  var JTaro = Object.create(null)

  // Vue install
  JTaro.install = function (Vue, options) {
    // **JTaro Error Start**
    if (options && !options.JRoll && !window.JRoll) {
      console.error('[JTaro warn]: JTaro must depend on JRoll')
    }
    if (options && options.distance && (options.distance < 0 || options.distance > 1)) {
      console.error('[JTaro warn]: distance options range must be: 0 < distance < 1')
    }
    // **JTaro Error end**;;

    // 创建样式
    var style = document.getElementById('jtaro_style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'jtaro_style'
      style.innerHTML = 'html,body{height:100%;padding:0;margin:0}#jtaro_app{position:relative;width:100%;height:100%;overflow:hidden}.jtaro-view{position:absolute;width:100%;height:100%;overflow:hidden;background:#fff}'
      document.head.appendChild(style)
    }

    var NotFound = { template: '<div style="text-align:center;padding-top:100px">404 Page not found</div>' }

    var WIDTH = window.innerWidth

    options = options || {}

    JTaro.params = null
    JTaro.views = []
    JTaro.version = '{{version}}'
    JTaro.options = {
      JRoll: options.JRoll || window.JRoll,
      el: options.el || '#jtaro_app', // 默认挂载元素
      default: options.default || 'home',  // 默认页
      distance: options.distance || 0.3,    // 页面后退距离百分比，以屏幕宽度为1
      duration: options.duration || 200     // 页面过渡时间
    }

    // beforeEnter路由钩子
    function beforeEnterHook (vueCompoent, callback) {
      var beforeEnter = vueCompoent.options.beforeEnter
      if (typeof beforeEnter === 'function') {
        if (beforeEnter.call(JTaro, function (method) { callback(method) })) {
          callback()
        }
      } else {
        callback()
      }
    }

    // afterEnter路由钩子
    function afterEnterHook (viewCompoent) {
      // **JTaro Error Start**
      if (!Vue.options.components[viewCompoent.jtaro_tag]) {
        console.error('[JTaro warn]: Vue component <' + viewCompoent.jtaro_tag + '> is not define. Please use `this.go` to modify the route, do not manually modify the hash')
      }
      // **JTaro Error end**;;

      var afterEnter = Vue.options.components[viewCompoent.jtaro_tag].options.afterEnter
      if (typeof afterEnter === 'function') {
        afterEnter.call(viewCompoent, JTaro.params)
      }
    }

    // beforeLeave路由钩子
    function beforeLeaveHook (viewCompoent, callback) {
      var beforeLeave = Vue.options.components[viewCompoent.$parent.jtaro_tag].options.beforeLeave
      if (typeof beforeLeave === 'function') {
        if (beforeLeave.call(viewCompoent, function () { callback() })) {
          callback()
        }
      } else {
        callback()
      }
    }

    // 页面切入动画（新增页面）
    function slideIn (viewCompoent, _jroll) {
      var el = viewCompoent.$el
      var preSib = el.previousElementSibling

      if (JTaro.method) {
        JTaro.method.call(viewCompoent, viewCompoent)
      }

      JTaro.sliding = true
      _jroll.utils.moveTo(el, WIDTH, 0)

      setTimeout(function () {
        // 收入当前页
        if (preSib) {
          _jroll.utils.moveTo(preSib, -WIDTH * JTaro.options.distance, 0, JTaro.options.duration, function () {
            // 将当前页的上一页隐藏，保持只有两个页面为display:block
            var preSibSib = preSib.previousElementSibling
            if (preSibSib) {
              preSibSib.style.display = 'none'
            }
          })
        }

        // 滑进新建页
        _jroll.utils.moveTo(el, 0, 0, JTaro.options.duration, function () {
          JTaro.sliding = false

          // afterEnter hook 前进
          afterEnterHook(viewCompoent)
        })
      }, 0)
    }

    // 页面切出动画（删除页面）
    function slideOut (el, _jroll, cb) {
      var nxtSib = el.nextElementSibling
      JTaro.sliding = true

      // 撤出当前页
      if (nxtSib) {
        _jroll.utils.moveTo(nxtSib, WIDTH, 0, JTaro.options.duration, cb)
      }

      // 滑出上一页
      _jroll.utils.moveTo(el, 0, 0, JTaro.options.duration, function () {
        JTaro.sliding = false
        // 将上一页的上一页显示，保持有两个页面为display:block
        var preSib = el.previousElementSibling
        if (preSib) {
          preSib.style.display = 'block'
        }
      })
    }

    // 递归删除页面
    function recursionDelPage (views, children, _jroll, i) {
      var l = views.length
      if (l - 1 > i) {
        slideOut(children[l - 2], _jroll, function () {
          views.splice(l - 1)
          children[l - 1].parentNode.removeChild(children[l - 1])
          setTimeout(function () {
            recursionDelPage(views, children, _jroll, i)
          }, 0)
        })
      }
      if (l - 1 === i) {
        // afterEnter hook 后退
        afterEnterHook(findVueComponent(views[i]))
      }
    }

    function parseUrlParams (a) {
      var p = a.split('&')
      var o = {}
      p.forEach(function (i) {
        var t = i.split('=')
        o[t[0]] = t[1]
      })
      return o
    }

    function findVueComponent (_hash) {
      var children = JTaro.vm.$children
      var i = 0
      var l = children.length
      for (; i < l; i++) {
        if (children[i].jtaro_tag === _hash) {
          return children[i]
        }
      }
    }

    /* 删除或添加页面
    * 1、与路由对应页面不存在->添加
    * 2、与路由对应页面已存在->将该页面往后的所有页面都删除
    */
    function pushView (_hash, jroll) {
      var h = _hash.replace('#!', '').split('?')[0]
      var v = JTaro.vm.$data.views
      var i = JTaro.views.indexOf(h)
      var viewCompoent = findVueComponent(h)

      if (i === -1) {
        if (v.indexOf(h) === -1) {
          v.push(h)
        } else {
          JTaro.vm.$el.appendChild(viewCompoent.$el)
          slideIn(viewCompoent, jroll)
        }
        JTaro.views.push(h)
      } else {
        if (JTaro.method) {
          JTaro.method.call(viewCompoent, viewCompoent)
        }
        recursionDelPage(JTaro.views, JTaro.vm.$el.childNodes, jroll, i)
      }
    }

    function reset () {
      WIDTH = window.innerWidth
    }

    // 页面组件
    var JTaroView = {
      props: ['view'],
      data: function () {
        return {
          jtaro_tag: this.view
        }
      },
      render: function (h) {
        return h(Vue.options.components[this.view] || NotFound)
      },
      mounted: function () {
        slideIn(this, JTaro.options.JRoll)
      }
    }

    Vue.component('jt-view', JTaroView)

    // 注册postMessage方法
    Vue.prototype.postMessage = function (msg, name) {
      var view = findVueComponent(name)
      var component = Vue.options.components[name]
      var method = component ? component.options.onMessage : null
      if (view && method) {
        method.call(view.$children[0], { message: msg, origin: this.$parent.jtaro_tag })
      }
    }

    // 跳到路由
    Vue.prototype.go = function (route, options) {
      // 页面切换过程中不执行路由跳转
      if (!JTaro.sliding) {
        beforeLeaveHook(this, function () {
          // 截取url参数
          var h = route.replace('#!', '')
          var p = h.split('?')

          // **JTaro Error Start**
          if (!Vue.options.components[p[0]]) {
            console.error('[JTaro warn]: Vue component <' + p[0] + '> is not define')
          }
          // **JTaro Error end**;;

          beforeEnterHook(Vue.options.components[p[0]], function (method) {
            if (method) {
              JTaro.method = method
            } else {
              JTaro.method = null
            }
            if (p[1]) {
              JTaro.params = parseUrlParams(p[1])
            } else if (options) {
              JTaro.params = options
            } else {
              JTaro.params = null
            }
            if (typeof route === 'number') {
              window.history.go(route)
            } else {
              window.location.hash = '!' + route
            }
          })
        })
      }
    }

    JTaro.vm = new Vue({
      el: JTaro.options.el,
      data: {
        views: []
      },
      template: '<div id="' + JTaro.options.el.replace('#', '') + '"><jt-view class="jtaro-view" v-for="view in views" :view="view"></jt-view></div>'
    })

    // 监听路由变化
    window.addEventListener('hashchange', function () {
      pushView(window.location.hash, JTaro.options.JRoll)
    })
    // 页面宽度改变更新动画宽度
    window.addEventListener('resize', reset)
    window.addEventListener('orientationchange', reset)

    // 启动
    ;(function () {
      var hash = window.location.hash
      var vueCompoent = Vue.options.components[JTaro.options.default || hash.replace('#!', '').split('?')[0]]

      // **JTaro Error Start**
      if (!vueCompoent) {
        console.error('[JTaro warn]: Vue component <' + (JTaro.options.default || hash.replace('#!', '').split('?')[0]) + '> is not define')
      }
      // **JTaro Error end**;;

      if (vueCompoent) {
        beforeEnterHook(vueCompoent, function (method) {
          if (method) {
            JTaro.method = method
          } else {
            JTaro.method = null
          }

          // 跳到默认路由
          if (hash === '') {
            window.location.hash = '!' + JTaro.options.default

          // 跳到指定路由
          } else {
            pushView(hash, JTaro.options.JRoll)
          }
        })
      }
    })()
  }

  return JTaro
}))
