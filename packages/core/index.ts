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

export type ForelChild = ForelElement | String | string | number
export type state = {
    get: Function,
    set: Function,
    onUpdate: Function
}

export type store = {
    get: Function,
    set: Function,
    onUpdate: Function,
    subscribe: Function
}

export type StatefulType = state | store

export type subscriptionEvent = "set" | "get" | "onupdate"
 
export class ForelElement {
    coreElement: HTMLElement
    constructor(HTMLTag: string, ...children: ForelChild[]) {
        this.coreElement = document.createElement(HTMLTag)
        children.forEach((child: ForelChild) => {
 
            if ( typeof(child) == "string" || typeof(child) == "number" ) {
                this.coreElement.appendChild(
                    document.createTextNode(`${child}`)
                )
            } else {
                this.coreElement.appendChild(
                    //@ts-ignore
                    child.coreElement
                )
            }
 
        })
    }
 
    id(Id: string) {
        this.coreElement.id = Id
        return this
    }
 
    class(...classnames: string[]) {
 
        classnames.forEach((classname: string) => {
            if ( classname != "" ) {
                this.coreElement.classList.add(...classname.split(" "))
            }
        })
 
        return this
 
    }
 
    prop(name: string, value: string) {
        this.coreElement.setAttribute(name, value)
        return this
    }
 
    event(name: string, callback: Function) {
        this.coreElement.addEventListener(name, (e) => callback(e))
        return this
    }

    //adding reference to itself (basically binding itself to a state)
    ref(state: state) {
        state.set(this.coreElement)
        return this
    }
 
    onRemove(callback: Function) {
        //a custom object _Forel_remove_api to simply detect if
        //this particular node was removed or not. It is as
        //simple as that
        //@ts-ignore
        this.coreElement._Forel_remove_api = callback
        return this
    }
 
}


export function State<StateType>(initial?: StateType): state {
 
    var data: StateType | undefined = initial
    var updateCandidates: Function[] = []
 
    function get(): StateType | undefined {
        return data
    }
 
    function set(newstate?: StateType) {
        data = newstate
        updateCandidates.forEach(callback => callback())
    }
 
    function onUpdate(callback: Function) {
        updateCandidates.push(callback)
    }

    return {
        get,
        set,
        onUpdate,
    }
 
}

export function Store<StoreType>(initial?: StoreType): store {
 
    var data: StoreType | undefined = initial
    var updateCandidates: Function[] = []
    var subscriptions: {
        set: Function[],
        get: Function[],
        onupdate: Function[]
    } = {
        get: [], set: [], onupdate: []
    }
    
    function get(): StoreType | undefined {
        subscriptions.get.forEach(callback => callback(data))
        return data
    }
 
    function set(newstore?: StoreType) {
        subscriptions.set.forEach(callback => callback(data))
        data = newstore
        updateCandidates.forEach(callback => callback())
    }
 
    function onUpdate(callback: Function) {
        subscriptions.onupdate.forEach(callback => callback(data))
        updateCandidates.push(callback)
    }

    function subscribe(event: subscriptionEvent, callback: Function) {
        switch(event) {
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

export function $(callback: Function, ...states: StatefulType[]) {
 
     //using the callback's UI definition instead of
     //creating a new one to improve space and performance
    var data = callback()
 
     /**
      * This one exploits the updateCandidates, since callbacks
      * will be re-executed whenever the corresponding states
      * are updated
      */
    states.forEach((State: StatefulType) => {
         State.onUpdate(() => {
 
             //We need the HTML part, so instead of replacing the
             //node (which is very inefficient)
             data.coreElement.innerHTML = callback().coreElement.outerHTML
 
         })
     })
 
    return data
}
 
export function When(condition: Boolean, if_true: ForelChild, if_false: ForelChild) {
    if ( condition ) {
        return if_true
    } else {
        return if_false
    }
}
 
export async function onLoad(callback: Function, ...dependency: StatefulType[]) {
    callback()
    dependency.forEach(state => {
        state.onUpdate(callback)
    })
}
 
export function render(id: string, app: ForelElement) {
    //@ts-ignore
    document.getElementById(id)
    .replaceChildren(app.coreElement) //make sure the App returns a valid HTML Element
 
    new MutationObserver((mutations) => {
        Object.keys(mutations).forEach(i => {
            //@ts-ignore
            mutations[i].removedNodes.forEach((node: any) => {
                if ( node._Forel_remove_api != undefined ) {
                    node._Forel_remove_api()
                }
            })
        })
    }).observe(app.coreElement, { childList: true, subtree: true })
}