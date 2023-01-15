'@forel/core: 1.0.5, @forel/web: 1.0.0'
// MIT License
class ForelElement {
    coreElement
    constructor(HTMLTag, ...children) {
        this.coreElement = document.createElement(HTMLTag)
        children.forEach((child) => {
            if (typeof (child) == "string" || typeof (child) == "number") {
                this.coreElement.appendChild(document.createTextNode(`${child}`))
            }
            else {
                this.coreElement.appendChild(
                //@ts-ignore
                child.coreElement)
            }
        })
    }
    id(Id) {
        this.coreElement.id = Id
        return this
    }
    class(...classnames) {
        classnames.forEach((classname) => {
            this.coreElement.classList.add(...classname.split(" "))
        })
        return this
    }
    prop(name, value) {
        this.coreElement.setAttribute(name, value)
        return this
    }
    event(name, callback) {
        this.coreElement.addEventListener(name, (e) => callback(e))
        return this
    }
    //adding reference to itself (basically binding itself to a state)
    ref(state) {
        state.set(this.coreElement)
    }
    onRemove(callback) {
        //a custom object _Forel_remove_api to simply detect if
        //this particular node was removed or not. It is as
        //simple as that
        //@ts-ignore
        this.coreElement._Forel_remove_api = callback
        return this
    }
}
function State(initial) {
    var data = initial
    var updateCandidates = []
    function get() {
        return data
    }
    function set(newstate) {
        data = newstate
        updateCandidates.forEach(callback => callback())
    }
    function onUpdate(callback) {
        updateCandidates.push(callback)
    }
    return {
        get,
        set,
        onUpdate,
    }
}
function Store(initial) {
    var data = initial
    var updateCandidates = []
    var subscriptions = {
        get: [], set: [], onupdate: []
    }
    function get() {
        subscriptions.get.forEach(callback => callback(data))
        return data
    }
    function set(newstore) {
        subscriptions.set.forEach(callback => callback(data))
        data = newstore
        updateCandidates.forEach(callback => callback())
    }
    function onUpdate(callback) {
        subscriptions.onupdate.forEach(callback => callback(data))
        updateCandidates.push(callback)
    }
    function subscribe(event, callback) {
        switch (event) {
            case "get":
                subscriptions.get.push(callback)
                break
            case "set":
                subscriptions.set.push(callback)
                break
            case "onupdate":
                subscriptions.onupdate.push(callback)
                break
        }
    }
    return {
        get,
        set,
        onUpdate,
        subscribe
    }
}
/**
  * New jquery-like definition for parts of UI
  * that changes due to change of state.
  *
  * The updated version does not even adds a new
  * div, which was a problem in the preview beta
  * and it helps reduce the tree problem.
  *
  * Try to keep inputs outside of stateful rendering
  * to create a performant app
*/
function $(callback, ...states) {
    //using the callback's UI definition instead of
    //creating a new one to improve space and performance
    var data = callback()
    /**
     * This one exploits the updateCandidates, since callbacks
     * will be re-executed whenever the corresponding states
     * are updated
     */
    states.forEach((State) => {
        State.onUpdate(() => {
            //We need the HTML part, so instead of replacing the
            //node (which is very inefficient)
            data.coreElement.innerHTML = callback().coreElement.outerHTML
        })
    })
    return data
}
function When(condition, if_true, if_false) {
    if (condition) {
        return if_true
    }
    else {
        return if_false
    }
}
async function onLoad(callback, ...dependency) {
    callback()
    dependency.forEach(state => {
        state.onUpdate(callback)
    })
}
function render(id, app) {
    //@ts-ignore
    document.getElementById(id)
        .replaceChildren(app.coreElement) //make sure the App returns a valid HTML Element
    new MutationObserver((mutations) => {
        Object.keys(mutations).forEach(i => {
            //@ts-ignore
            mutations[i].removedNodes.forEach(node => {
                if (node._Forel_remove_api != undefined) {
                    node._Forel_remove_api()
                }
            })
        })
    }).observe(app.coreElement, { childList: true, subtree: true })
}
// MIT License
// Copyright (c) 2022 Mayukh Chakraborty
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function Url(base_url, callback) {
    //the element to be called
    return {
        url: base_url,
        callBack: callback
    }
}
function AppRouter(base_url, ...urlNodes) {
    //this is useful for many purposes
    //the URLNodes are the functions that possess the URL data
    //return whatever the current url is.
    var routerElement = new ForelElement("div")
    let currentPath = window.location.pathname
    //update the path during initialization
    urlNodes.forEach(node => {
        if (currentPath == `${base_url}${node.url}`) {
            if (window.history.state) {
                routerElement.coreElement.replaceChildren(node.callBack(...window.history.state.data).coreElement)
            }
            else {
                routerElement.coreElement.replaceChildren(node.callBack().coreElement)
            }
        }
    })
    //let's also add some event Listners in Case we
    //want to listen to back track events
    function CallBack() {
        //now do the same thing
        urlNodes.forEach(node => {
            if (window.location.pathname == `${base_url}${node.url}`) {
                if (window.history.state) {
                    routerElement.coreElement.replaceChildren(node.callBack(...window.history.state.data).coreElement)
                }
                else {
                    routerElement.coreElement.replaceChildren(node.callBack().coreElement)
                }
            }
        })
    }
    //this one is used to track the non-native page transition
    //or the AppNavigate events
    window.addEventListener("popstate", CallBack)
    window.addEventListener("urlchange", CallBack) //a new custom event
    //now remove the event listner, when not in Need, because
    //ofcourse why would you even need when the component is out of scope
    //@ts-ignore
    routerElement._bolt_remove_api = () => {
        window.removeEventListener("popstate", CallBack)
        window.removeEventListener("urlchange", CallBack)
    }
    return routerElement
}
function AppNavigator(base_url, ...data) {
    if (base_url == window.location.pathname) {
        //depends, like if the data was not same?
        if (data.length = 0) {
            return //if there is no data, means a static transition
        }
    }
    window.history.pushState({ url: base_url, data }, "", base_url)
    //Now we will trigger some other type of event, a custom
    //event that might contain some functions that could
    //change the state
    window.dispatchEvent(new Event('urlchange'))
    //this event is used to say that the page was changed
    //wihtout really reloading the app entierely.
    //This is performant if you have no SSR requirements
}
// MIT License
// Copyright (c) 2022 Mayukh Chakraborty
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function a(...children) {
    return new ForelElement("a", ...children)
}
function abbr(...children) {
    return new ForelElement("abbr", ...children)
}
function acronym(...children) {
    return new ForelElement("acronym", ...children)
}
function address(...children) {
    return new ForelElement("address", ...children)
}
function applet(...children) {
    return new ForelElement("applet", ...children)
}
function area(...children) {
    return new ForelElement("area", ...children)
}
function article(...children) {
    return new ForelElement("article", ...children)
}
function aside(...children) {
    return new ForelElement("aside", ...children)
}
function audio(...children) {
    return new ForelElement("audio", ...children)
}
function b(...children) {
    return new ForelElement("b", ...children)
}
function base(...children) {
    return new ForelElement("base", ...children)
}
function basefont(...children) {
    return new ForelElement("basefont", ...children)
}
function bdi(...children) {
    return new ForelElement("bdi", ...children)
}
function bdo(...children) {
    return new ForelElement("bdo", ...children)
}
function big(...children) {
    return new ForelElement("big", ...children)
}
function blockquote(...children) {
    return new ForelElement("blockquote", ...children)
}
function body(...children) {
    return new ForelElement("body", ...children)
}
function br(...children) {
    return new ForelElement("br", ...children)
}
function button(...children) {
    return new ForelElement("button", ...children)
}
function canvas(...children) {
    return new ForelElement("canvas", ...children)
}
function caption(...children) {
    return new ForelElement("caption", ...children)
}
function center(...children) {
    return new ForelElement("center", ...children)
}
function cite(...children) {
    return new ForelElement("cite", ...children)
}
function code(...children) {
    return new ForelElement("code", ...children)
}
function col(...children) {
    return new ForelElement("col", ...children)
}
function colgroup(...children) {
    return new ForelElement("colgroup", ...children)
}
function datalist(...children) {
    return new ForelElement("datalist", ...children)
}
function dd(...children) {
    return new ForelElement("dd", ...children)
}
function del(...children) {
    return new ForelElement("del", ...children)
}
function details(...children) {
    return new ForelElement("details", ...children)
}
function dfn(...children) {
    return new ForelElement("dfn", ...children)
}
function dialog(...children) {
    return new ForelElement("dialog", ...children)
}
function dir(...children) {
    return new ForelElement("dir", ...children)
}
function div(...children) {
    return new ForelElement("div", ...children)
}
function dl(...children) {
    return new ForelElement("dl", ...children)
}
function dt(...children) {
    return new ForelElement("dt", ...children)
}
function em(...children) {
    return new ForelElement("em", ...children)
}
function embed(...children) {
    return new ForelElement("embed", ...children)
}
function fieldset(...children) {
    return new ForelElement("fieldset", ...children)
}
function figcaption(...children) {
    return new ForelElement("figcaption", ...children)
}
function figure(...children) {
    return new ForelElement("figure", ...children)
}
function font(...children) {
    return new ForelElement("font", ...children)
}
function footer(...children) {
    return new ForelElement("footer", ...children)
}
function form(...children) {
    return new ForelElement("form", ...children)
}
function frame(...children) {
    return new ForelElement("frame", ...children)
}
function frameset(...children) {
    return new ForelElement("frameset", ...children)
}
function h1(...children) {
    return new ForelElement("h1", ...children)
}
function h2(...children) {
    return new ForelElement("h2", ...children)
}
function h3(...children) {
    return new ForelElement("h3", ...children)
}
function h4(...children) {
    return new ForelElement("h4", ...children)
}
function h5(...children) {
    return new ForelElement("h5", ...children)
}
function h6(...children) {
    return new ForelElement("h6", ...children)
}
function head(...children) {
    return new ForelElement("head", ...children)
}
function header(...children) {
    return new ForelElement("header", ...children)
}
function hr(...children) {
    return new ForelElement("hr", ...children)
}
function html(...children) {
    return new ForelElement("html", ...children)
}
function i(...children) {
    return new ForelElement("i", ...children)
}
function iframe(...children) {
    return new ForelElement("iframe", ...children)
}
function img(...children) {
    return new ForelElement("img", ...children)
}
function input(...children) {
    return new ForelElement("input", ...children)
}
function ins(...children) {
    return new ForelElement("ins", ...children)
}
function kbd(...children) {
    return new ForelElement("kbd", ...children)
}
function keygen(...children) {
    return new ForelElement("keygen", ...children)
}
function label(...children) {
    return new ForelElement("label", ...children)
}
function legend(...children) {
    return new ForelElement("legend", ...children)
}
function li(...children) {
    return new ForelElement("li", ...children)
}
function link(...children) {
    return new ForelElement("link", ...children)
}
function main(...children) {
    return new ForelElement("main", ...children)
}
function map(...children) {
    return new ForelElement("map", ...children)
}
function mark(...children) {
    return new ForelElement("mark", ...children)
}
function menu(...children) {
    return new ForelElement("menu", ...children)
}
function menuitem(...children) {
    return new ForelElement("menuitem", ...children)
}
function meta(...children) {
    return new ForelElement("meta", ...children)
}
function meter(...children) {
    return new ForelElement("meter", ...children)
}
function nav(...children) {
    return new ForelElement("nav", ...children)
}
function noframes(...children) {
    return new ForelElement("noframes", ...children)
}
function noscript(...children) {
    return new ForelElement("noscript", ...children)
}
function object(...children) {
    return new ForelElement("object", ...children)
}
function ol(...children) {
    return new ForelElement("ol", ...children)
}
function optgroup(...children) {
    return new ForelElement("optgroup", ...children)
}
function option(...children) {
    return new ForelElement("option", ...children)
}
function output(...children) {
    return new ForelElement("output", ...children)
}
function p(...children) {
    return new ForelElement("p", ...children)
}
function param(...children) {
    return new ForelElement("param", ...children)
}
function picture(...children) {
    return new ForelElement("picture", ...children)
}
function pre(...children) {
    return new ForelElement("pre", ...children)
}
function progress(...children) {
    return new ForelElement("progress", ...children)
}
function q(...children) {
    return new ForelElement("q", ...children)
}
function rp(...children) {
    return new ForelElement("rp", ...children)
}
function rt(...children) {
    return new ForelElement("rt", ...children)
}
function ruby(...children) {
    return new ForelElement("ruby", ...children)
}
function s(...children) {
    return new ForelElement("s", ...children)
}
function samp(...children) {
    return new ForelElement("samp", ...children)
}
function script(...children) {
    return new ForelElement("script", ...children)
}
function section(...children) {
    return new ForelElement("section", ...children)
}
function select(...children) {
    return new ForelElement("select", ...children)
}
function small(...children) {
    return new ForelElement("small", ...children)
}
function source(...children) {
    return new ForelElement("source", ...children)
}
function span(...children) {
    return new ForelElement("span", ...children)
}
function strike(...children) {
    return new ForelElement("strike", ...children)
}
function strong(...children) {
    return new ForelElement("strong", ...children)
}
function style(...children) {
    return new ForelElement("style", ...children)
}
function sub(...children) {
    return new ForelElement("sub", ...children)
}
function summary(...children) {
    return new ForelElement("summary", ...children)
}
function sup(...children) {
    return new ForelElement("sup", ...children)
}
function table(...children) {
    return new ForelElement("table", ...children)
}
function tbody(...children) {
    return new ForelElement("tbody", ...children)
}
function td(...children) {
    return new ForelElement("td", ...children)
}
function template(...children) {
    return new ForelElement("template", ...children)
}
function textarea(...children) {
    return new ForelElement("textarea", ...children)
}
function tfoot(...children) {
    return new ForelElement("tfoot", ...children)
}
function th(...children) {
    return new ForelElement("th", ...children)
}
function thead(...children) {
    return new ForelElement("thead", ...children)
}
function time(...children) {
    return new ForelElement("time", ...children)
}
function title(...children) {
    return new ForelElement("title", ...children)
}
function tr(...children) {
    return new ForelElement("tr", ...children)
}
function track(...children) {
    return new ForelElement("track", ...children)
}
function tt(...children) {
    return new ForelElement("tt", ...children)
}
function u(...children) {
    return new ForelElement("u", ...children)
}
function ul(...children) {
    return new ForelElement("ul", ...children)
}
function Var(...children) {
    return new ForelElement("var", ...children)
}
function video(...children) {
    return new ForelElement("video", ...children)
}
function wbr(...children) {
    return new ForelElement("wbr", ...children)
}
