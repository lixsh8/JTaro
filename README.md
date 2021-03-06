# 醉芋头 JTaro

> An H5 SPA framework for Vue.js 2.0

## 先睹为快

<img width="160" height="160" src="http://www.chjtx.com/JTaro/demos/images/qrcode.png">

[http://www.chjtx.com/JTaro/](http://www.chjtx.com/JTaro/)

## 依赖

- Vue 2.x [Vue 2.x 中文教程](https://www.vuefe.cn/)
- JRoll 2.x [JRoll 2.x 官网](http://www.chjtx.com/JRoll/)

## 下载

### CDN

```html
<script src='https://unpkg.com/jtaro/src/jtaro.js'></script>
```

### NPM

```bash
npm install jtaro
```

## 说明

- JTaro是一款基于Vue2.0开发的轻量级SPA框架
- JTaro不需要vue-router，自身提供简单路由功能和页面切换动画
- 页面组件名称即为路由，省去手动配置路由的麻烦
- JTaro会自动创建一些css样式，将html、body的width、height设为100%，并overflow:hidden，超出内容需要使用JRoll进行滑动

## 快速上手

1、 创建index.html文件并在head里引入Vue、JRoll

```html
<script src='https://unpkg.com/vue/dist/vue.js'></script>
<script src='https://unpkg.com/jroll/src/jroll.js'></script>
```

2、 在body里创建id为`jtaro_app`的div，并在其后引入JTaro

```html
<div id="jtaro_app"></div>
<script src='https://unpkg.com/jtaro/src/jtaro.js'></script>
```

3、 在`div#jtaro_app`之后编写Vue组件，并执行`Vue.use(JTaro)`启动应用

*注意：务必确保首页组件在Vue.use(JTaro)之前注册*

```html
<script>
Vue.component('home', {
  template: '<div id="home">Hello JTaro!</div>'
})

Vue.use(JTaro)
</script>
```

4、 将index.html文件拖到浏览器访问

要了解更多请查看示例

## 运行示例

```bash
git clone https://github.com/chjtx/JTaro.git

cd JTaro

npm install

npm run dev
```

> `npm install`下载太慢？那就直接`clone`之后将`index.html`拖到浏览器即可。不要用`cnpm`，会导致很多依赖缺失

## 基础用法

### 启动 Vue.use(JTaro)

```js
Vue.use(JTaro)

// or 传入选项参数
Vue.use(JTaro, {
  el: '#jtaro_app',
  default: 'home',
  distance: 0.3,
  duration: 200,
  JRoll: window.JRoll
})
```

| 选项 | 默认值 | 说明 |
|:----:|:----:|:----|
| el | '#jtaro_app' | 给Vue挂载的元素 |
| default | 'home' | 默认首页 |
| distance | 0.3 | 页面折叠距离位数，以屏幕宽度为1，取值范围为0 <= distance <= 1 |
| duration | 200 | 页面切换过滤时间 |
| JRoll | window.JRoll | 用于异步引入JRoll，不能确保JRoll和JTaro顺序时使用 |


### 跳转 this.go

```js
Vue.component('home', {
  methods: {
    goPage: function () {
      // 跳到page页
      this.go('page')

      // or 返回上一页
      this.go(-1)

      // or Url带参跳到page页
      this.go('page?a=1&b=2')

      // or 键值对带参跳到page页
      this.go('page', {a: 1, b: 2})
    }
  }
})

Vue.component('page', {
  afterEnter: function (params) {
    console.log(params)
  }
})
```

- this.go可传入两个参数，第一个必须，第二个可选
- 参数一，字符串或数字，当为字符串时即渲染对应组件，为数字时调用原生history.go方法
- 参数二，键值对，该键值将保存在JTaro.params里，并传递给下一页面的afterEnter钩子
- 支持在url传参，使用`?a=1&b=2`形式，最终也是保存在JTaro.params里
- url传参优先级高于键值对传参

## 路由

### 路由说明

- 只识别以`#!`分割的hash，不支持`history.pushState`
- 每个hash路由都应有与之对应的Vue组件，如在浏览器访问index.html#!home，JTaro将自动查找以`home`命名的Vue组件并渲染到`div#jtaro_app`里
- 路由不可重复，如有A、B、C、D四个页面，按顺序访问A->B->C->D，在D页面返回到B，将剩下A->B两个页面
- 请使用`this.go(-1)`进行页面后退操作，可让历史记录保持在最简洁状态，若要连续返回上两个页面，则使用`this.go(-2)`，如此类推
- 请使用`this.go`进行页面跳转，其作用有：
  - 避免直接操作hash破坏路由历史记录
  - 可调用beforeEnter路由钩子，直接修改hash将不会触发beforeEnter钩子
  - 在页面切换动画进行时不会触发hashChange，阻止频繁切换页面

### 路由钩子

- [beforeEnter](#beforeenter)
- [afterEnter](#afterenter)
- [beforeLeave](#beforeleave)

#### beforeEnter

进入该路由（页面滑入）之前执行

```js
Vue.component('home', {
  beforeEnter: function () {
    // 不！能！获取页面组件实例 `this`
    // 因为当钩子执行时，组件实例还没被创建
    return true
  }
})

// or
Vue.component('home', {
  beforeEnter: function (cb) {
    // 不！能！获取页面组件实例 `this`
    // 因为当钩子执行时，组件实例还没被创建
    setTimeout(function () {
      cb()
    }, 3000)
  }
})
```

`beforeEnter`会阻断路由，可执行同步或异步代码，因此需要`return true`或者执行回调`cb()`继续执行后面的代码，同步使用`return true`，异步或需要使用页面组件实例`this`时请用`cb()`

`beforeEnter`不能获取页面组件实例`this`，因为当勾子执行时，组件实例还没被创建，可将方法传进`cb()`，实例创建后会立即执行该方法

```js
Vue.component('home', {
  beforeEnter: function (cb) {
    console.log(this) // JTaro
    cb(function (vm) {
      console.log(this) // <home>组件实例`this`
      console.log(vm)   // <home>组件实例`this`
    })
  }
})
```

#### afterEnter

进入该路由（页面已滑入，不含动画过程）后执行

```js
Vue.component('home', {
  afterEnter: function () {
    // ...
  }
})
```

afterEnter 不会阻断路由执行

#### beforeLeave

离开该路由（页面滑出）之前执行

```js
Vue.component('home', {
  beforeLeave: function (cb) {
    setTimeout(function () {
      // ...
      cb()
    }, 1000)
  }
})
```

beforeLeave 和 beforeEnter 一样都会阻断路由执行，因此需要`return true`或者执行回调`cb()`来继续执行后面的代码

四个钩子执行顺序 beforeEnter -> (mounted) -> afterEnter -> beforeLeave

**注意：**

1. mounted为Vue原有生命周期钩子，首次访问页面时会执行该钩子，此后JTaro将缓存该页面，不会再执行该钩子
2. beforeEnter、afterEnter、beforeLeave在每次路由变更都会执行

### 钩子使用技巧

- beforeEnter （JTaro扩展） 先加载数据，若数据加载失败则不显示该页面的情况使用该钩子
- mounted （Vue原有） 无论何时基本上不会发生变更的页面使用该钩子
- afterEnter （JTaro扩展） 页面加载后才开始加载数据，填充数据，并且每次进入该路由都有数据变更的情况使用该钩子
- beforeLeave （JTaro扩展） 页面离开前先需要执行一此操作，例如关闭弹窗、确认表单等情况可使用该钩子


## 页面组件间通讯

- 使用`this.postMessage(<msg>, <page>)`发送消息

```js
/* postMessage(<msg>, <name>)
 * @param msg 消息内容
 * @param name Vue组件名称
 */
Vue.component('about', {
  mounted: function () {
    //向home页面发送modifyTitle消息通知home页面修改标题
    this.postMessage('modifyTitle', 'home')
  }
})
```

- 使用`onMessage`选项接收消息

```js
Vue.component('home', {
  onMessage: function (event) {
    console.log(event) // {message: 'modifyTitle', origin: 'about'}
  }
})
```

> 注意：只有页面组件（与路由对应的组件）才可以使用postMessage和onMessage，

### Q & A

*问：为什么不提供获取页面实例的方法？例如`getPageByName('home')`获取home页面，然后可以在其它页面操作home页面*

*答：为了方便维护，每处修改都有据可寻，因此建议每个页面组件只操作自身的数据，如果需要操作其它页面的数据，只需要向目标页面发送消息，让目标页面去处理。*


## 配合vue-cli使用

敬请期待...

## TODO

- [x] 简单路由功能，根据组件名称动态创建页面
- [x] 页面切换动画
- [x] 页面组件与页面组件之间的通讯postMessage、onMessage，使用方式要比官方的$on和$emit更简单
- [x] 保持最多不超过三个页面为display:block，其余为display:none，有效解决安卓机页面过多渲染慢的问题
- [x] 实现页面beforeEnter、afterEnter和beforeLeave路由钩子
- [x] JTaro.boot({...})选项配置
- [ ] 实现全局路由钩子
- [ ] 嵌入微型fastclick解决老机点击300ms延迟问题

