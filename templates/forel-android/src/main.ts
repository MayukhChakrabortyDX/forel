import { render } from "@forel/core";
import { button, div, i, p } from '@forel/web/components'

import './style.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

function HelloWorld() {
    return div(
        div(
            p("Welcome To"),
            p("FOREL").id("logo"),
            div(
                button("Get Started With Forel").id("get-started")
            ).id("btn"),
            div(
                i().class("bi bi-facebook"),
                i().class("bi bi-instagram"),
                i().class("bi bi-github"),
                i().class("bi bi-twitter"),
                i().class("bi bi-globe")
            ).id("social")
        ).class("forel-app-inner")
    ).class("forel-app")
}

render("app", HelloWorld())