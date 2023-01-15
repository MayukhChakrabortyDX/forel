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

import { ForelElement } from '@forel/core'

export type URL = {
    url: string,
    callBack: Function
}

export function Url(base_url: string, callback: Function): URL {
    //the element to be called
    return {
        url: base_url,
        callBack: callback
    }
}

export function AppRouter(base_url: string, ...urlNodes: URL[]) {
    //this is useful for many purposes
    //the URLNodes are the functions that possess the URL data
    //return whatever the current url is.
    var routerElement = new ForelElement("div")
    let currentPath = window.location.pathname
    //update the path during initialization
    urlNodes.forEach(node => {
        if ( currentPath == `${base_url}${node.url}` ) {
            if ( window.history.state ) {
                routerElement.coreElement.replaceChildren(node.callBack(...window.history.state.data).coreElement)
            } else {
                routerElement.coreElement.replaceChildren(node.callBack().coreElement)
            }
        }
    })

    //let's also add some event Listners in Case we
    //want to listen to back track events
    function CallBack() {
        //now do the same thing
        urlNodes.forEach(node => {
            if ( window.location.pathname == `${base_url}${node.url}` ) {
                if ( window.history.state ) {
                    routerElement.coreElement.replaceChildren(node.callBack(...window.history.state.data).coreElement)
                } else {
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

export function AppNavigator(base_url, ...data: any[]) {
    if ( base_url == window.location.pathname ) {
        //depends, like if the data was not same?
        if ( data.length = 0 ) {
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