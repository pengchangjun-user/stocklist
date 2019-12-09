import React, { useState } from 'react'
import GeneralSituation from "./generalSituation"
import Holderlist from "./holderlist"
import { Button } from "antd"
import appGlobal from "../../global/global"


const CreditStockAnalyze = () => {
    const [ current, setCurrent ] = useState(appGlobal.currentChildKey ? appGlobal.currentChildKey : "generalSituation")

    const groupBtn = {
        marginRight: "10px",
        borderRadius: "4px"
    }
    const clickBtn = (key) => {
        setCurrent(key)
        appGlobal.currentChildKey = key
    }

    const renderContent = () => {
        switch (current) {
            case 'generalSituation':
                return <GeneralSituation />
            case 'holderlist':
                return <Holderlist />
            default:
                return <GeneralSituation />
        }
    }
    return (
        <div style={{padding: "0 24px 0 16px", height: "100%", boxSizing: "border-box"}}>
            <div style={{marginBottom: "22px"}}>
                <Button type={ "generalSituation" === current ? "primary" : "default" } style={groupBtn} onClick={() => clickBtn('generalSituation')}>信用股东概况</Button>
                <Button type={ "holderlist" === current ? "primary" : "default" } style={groupBtn}  onClick={() => clickBtn('holderlist')}>股东列表</Button>
            </div>
            {renderContent()}
        </div>
    )
}

export default CreditStockAnalyze