import React, { useState } from "react"
import Concentration from "./concentration"
import CoreData from "./coreData"
import GroupStatistical from "./groupStatistical"
import HolderNature from "./holderNature"
import Holderlist from "./holderlist"
import RegionalDistribution from "./regionalDistribution"
import { Button } from "antd"
import appGlobal from "../../global/global"

const Compare = () => {
    const [ current, setCurrent ] = useState(appGlobal.currentChildKey ? appGlobal.currentChildKey : "core_data")

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
            case 'core_data':
                return <CoreData />
            case 'holder_list':
                return <Holderlist />
            case 'holder_nature':
                return <HolderNature />
            case 'group_statistical':
                return <GroupStatistical />
            case 'concentration':
                return <Concentration />
            case 'regional_distribution':
                return <RegionalDistribution />
            default:
                return <CoreData />
        }
    }

    return (
        <div style={{padding: "0px 24px 0 16px", height: "100%", boxSizing: "border-box"}}>
            <div style={{marginBottom: "44px"}}>
                <Button type={ "core_data" === current ? "primary" : "default" } style={groupBtn} onClick={() => clickBtn('core_data')}>核心数据</Button>

                <Button type={ "holder_list" === current ? "primary" : "default" } style={groupBtn}  onClick={() => clickBtn('holder_list')}>股东列表</Button>

                <Button type={ "holder_nature" === current ? "primary" : "default" } style={groupBtn}  onClick={() => clickBtn('holder_nature')}>股东性质</Button>

                <Button type={ "group_statistical" === current ? "primary" : "default" } style={groupBtn}  onClick={() => clickBtn('group_statistical')}>分组统计</Button>

                <Button type={ "concentration" === current ? "primary" : "default" } style={groupBtn}  onClick={() => clickBtn('concentration')}>集中度情况</Button>

                <Button type={ "regional_distribution" === current ? "primary" : "default" } style={groupBtn}  onClick={() => clickBtn('regional_distribution')}>地域分布</Button>
            </div>
            {renderContent()}
        </div>
    )
}

export default Compare
