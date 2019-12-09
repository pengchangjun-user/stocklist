import React, { useState } from "react"
import './header.scss'

const { ipcRenderer } = window.require("electron")

const Header = () => {
    const [ isMaximize, setIsMaximize ] = useState(false)

    const unmaximize = () => {
        setIsMaximize(false)
        ipcRenderer.send('window-event', 'unmaximize')
    }

    const maximize = () => {
        setIsMaximize(true)
        ipcRenderer.send('window-event', 'maximize')
    }

    return (
        <div className="header">
            <div></div>
            <div className="title">股东名册分析</div>
            <div className="operate">
                <div className="close" onClick={() => { ipcRenderer.send('window-event', 'close') }}></div>
                {
                    isMaximize
                        ? <div className="unfold" onClick={unmaximize}></div>
                        : <div className="fold" onClick={maximize}></div>
                }
                <div className="shrink" onClick={() => { ipcRenderer.send('window-event', 'minimize') }}></div>
            </div>
        </div>
    )
}

export default Header