import React, { useState, useEffect } from 'react'
import { HashRouter, Switch, Route } from "react-router-dom"
import Main from "./pages/main/main"
import HolderDetail from "./pages/holderDetail/holderDetail"
import NatureDetail from "./pages/natureDetail/natureDetail"
import GroupDetail from "./pages/groupDetail/groupDetail"
import './App.css'
import { Modal, Button, Input, Icon } from 'antd'
import Header from "./pages/header/header"

const { ipcRenderer } = window.require("electron")
const Store = window.require('electron-store')
const store = new Store()
const speakeasy = window.require("speakeasy")
const getmac = window.require("getmac")


function App() {
	const [ identifyCodeVisible, setIdentifyCodeVisible] = useState(false)
    const [ codeTipVisible, setCodeTipVisible] = useState(false)
    const [ machineCodeVisible, setMachineCodeVisible] = useState(false)
    const [ identifyCode, setIdentifyCode] = useState("")
    const [ machineCode, setMachineCode] = useState("")
	const [ authorizeFlag, setAuthorizeFlag] = useState(false)
	
	const identifyCodeMakesure = () => {
        let code = identifyCode.substring(0, 6)
		var verifyCode = speakeasy.totp({ secret: machineCode, step: 3600, algorithm: "sha1",encoding: "ascii" })
		if (code === verifyCode) {
            // 如果相等验证成功
            setIdentifyCodeVisible(false)
		} else {
            setAuthorizeFlag(true)
		}
    }

    const getMachinceCode = () => {
        getmac.getMac((err, macAddress) => {
			if (err)  throw err
            store.set("mac", macAddress)
            setMachineCode(macAddress)
            setCodeTipVisible(false)
            setMachineCodeVisible(true)
		})
    }

    const changeModal = () => {
        setIdentifyCodeVisible(true)
        setMachineCodeVisible(false)
    }

    // 一进来就读取electron-store的mac地址
    useEffect(() => {
        let mac = store.get("mac")
        if (mac) {
            setIdentifyCodeVisible(true)
            setMachineCode(mac)
        } else {
            setCodeTipVisible(true)
        }
    }, [])

	return (
		<div className="stockholders">
			<div className="stockholders-header">
				<Header />
			</div>
			<div className="stockholders-content">
				<div className="content-wrapper">
					<HashRouter>
						<Switch>
							<Route exact path={'/'} component={Main}/>
							<Route path="/detail" component={HolderDetail}/>
							<Route path="/natureDetail" component={NatureDetail}/>
							<Route path="/groupDetail" component={GroupDetail}/>
						</Switch>
					</HashRouter>
				</div>
			</div>
			{/* 离线模式需要输入动态码 */}
            <Modal
                width={450}
                closable={false}
                maskClosable={false}
                visible={identifyCodeVisible}
                centered
                footer={null}>
                <div className="modal-close" onClick={() => {ipcRenderer.send('window-event', 'close')}}><Icon type="close" /></div>
                <div className="code-title">请输入设备验证码</div>
                <Input value={identifyCode} className="modal-input" placeholder="请输入验证码" allowClear onChange={(e) => {setIdentifyCode(e.target.value)}} />
                {
                    authorizeFlag ? <div className="error">验证码不正确</div> : ""
                }
                <div onClick={() => {setIdentifyCodeVisible(false); setCodeTipVisible(true)}} className="get-code">如何获取设备验证码</div>
                <div className="login-btn">
                    <Button style={{ "marginRight": "20px" }} type="default" onClick={() => {ipcRenderer.send('window-event', 'close')}}>取消</Button>
                    <Button type="primary" onClick={identifyCodeMakesure}>
                        <span>确定</span>
                    </Button>
                </div>
            </Modal>
            {/* 温馨提示 */}
            <Modal
                width={450}
                closable={false}
                maskClosable={false}
                visible={codeTipVisible}
                centered
                footer={null}
                >
                <div className="modal-close" onClick={() => {setIdentifyCodeVisible(true); setCodeTipVisible(false)}}>
                    <Icon type="close" />
                </div>
                <div className="code-title">温馨提示</div>
                <div className="tip-title">为了提高您设备及系统的安全性，需要您进行下列操作：</div>
                <ul className="code-text">
                    <li>1、获取您设备的机器码</li>
                    <li>2、将机器码填入董蜜对应的设备管理页中</li>
                    <li>3、从设备管理页中获取对应的设备验证码</li>
                </ul>
                <div style={{margin: '20px 10px'}}>
                    <div style={{textAlign: "center"}}>
                        <Button type="primary" onClick={getMachinceCode}>知道了，点击获取机器码</Button>
                    </div>
                </div>
            </Modal>
            {/* 获取机器码 */}
            <Modal
                width={450}
                closable={false}
                maskClosable={false}
                visible={machineCodeVisible}
                centered
                footer={null}
                >
                <div className="modal-close" onClick={changeModal}><Icon type="close" /></div>
                <div className="code-title">机器码</div>
                <div style={{marginTop: 20}}>当前设备机器码</div>
                <div className="code">{machineCode}</div>
                <div className="code-btn">
                    <Button type="primary" onClick={changeModal}>好的，去董秘-设备管理页填入</Button>
                </div>
            </Modal>
		</div>
	);
}

export default App;
